"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { DocumentLocationChange, OrganizationConfig } from "@/app/types/organization";
import { assignmentsToClusters, kmeans } from "@/app/utils/kmeans";
import { desc, eq } from "drizzle-orm";

// ========== Constants ==========
const DEFAULT_MAX_FOLDERS = 4; // A-J folders
const DEFAULT_MAX_SHELVES = 2; // 1-3 shelves

// ========== Helpers ==========
function averageEmbedding(vectors: number[][]): number[] | undefined {
  if (!vectors.length) return undefined;

  const dim = vectors[0].length;
  const sum = Array(dim).fill(0);

  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      sum[i] += vec[i];
    }
  }

  return sum.map((val) => val / vectors.length);
}

function clusterDocuments(embeddings: number[][], k: number, seed: number): number[][] {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return [[0]];
  if (k <= 1) return [Array.from({ length: embeddings.length }, (_, i) => i)];

  const { assignments } = kmeans(embeddings, k, 100, seed);
  return assignmentsToClusters(assignments, k);
}

function groupDocsByCluster<T>(data: T[], clusters: number[][]): T[][] {
  return clusters.map((cluster) => cluster.map((i) => data[i]));
}

function indexToLetter(i: number): string {
  return String.fromCharCode(65 + i); // 0 → A, 1 → B, etc.
}

// ========== Core Functions ==========
export async function suggestDocumentLocations(
  config: OrganizationConfig = {},
): Promise<{ success: boolean; suggestions?: DocumentLocationChange[]; error?: string }> {
  try {
    const { maxFolders = DEFAULT_MAX_FOLDERS, maxShelves = DEFAULT_MAX_SHELVES } = config;

    // Validate input
    if (maxFolders <= 0 || maxFolders > 26) {
      return { success: false, error: "maxFolders must be between 1 and 26" };
    }
    if (maxShelves <= 0) {
      return { success: false, error: "maxShelves must be greater than 0" };
    }
    // we need to order docs created at
    const docs = await db
      .select({
        id: documents.id,
        name: documents.name,
        embedding: documents.embedding,
        shelf: documents.shelf,
        folder: documents.folder,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .orderBy(desc(documents.createdAt));

    // Filter out documents without embeddings
    const docsWithEmbeddings = docs.filter(
      (doc): doc is typeof doc & { embedding: number[] } => doc.embedding !== null && doc.embedding.length > 0,
    );

    if (docsWithEmbeddings.length === 0) {
      // Return empty suggestions instead of error when no documents with embeddings are found
      return { success: true, suggestions: [] };
    }

    // Adjust k based on data size
    const effectiveFolders = Math.min(maxFolders, docsWithEmbeddings.length);
    const embeddings = docsWithEmbeddings.map((d) => d.embedding);

    // First level clustering: documents into folders with seed 42
    const folderClusters = clusterDocuments(embeddings, effectiveFolders, 42);
    const folders = groupDocsByCluster(docsWithEmbeddings, folderClusters);

    // Second level clustering: folders into shelves with different seed
    const folderEmbeddings = folders
      .map((group) => averageEmbedding(group.map((doc) => doc.embedding)))
      .filter((embedding): embedding is number[] => embedding !== undefined);

    if (folderEmbeddings.length === 0) {
      return { success: false, error: "Failed to compute folder embeddings" };
    }

    const effectiveShelves = Math.min(maxShelves, folderEmbeddings.length);
    // Use a different seed (73) for shelf clustering
    const shelfClusters = clusterDocuments(folderEmbeddings, effectiveShelves, 73);

    const suggestions: DocumentLocationChange[] = [];

    for (const [shelfId, folderIds] of shelfClusters.entries()) {
      for (const folderId of folderIds) {
        const folderLabel = indexToLetter(folderId);
        for (const doc of folders[folderId]) {
          suggestions.push({
            id: doc.id,
            name: doc.name,
            currentLocation:
              doc.shelf || doc.folder
                ? {
                    shelf: doc.shelf ?? undefined,
                    folder: doc.folder ?? undefined,
                  }
                : undefined,
            suggestedLocation: {
              shelf: shelfId + 1, // Make shelves 1-based
              folder: folderLabel,
            },
          });
        }
      }
    }

    return { success: true, suggestions };
  } catch (error) {
    console.error("Error suggesting document locations:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function applySuggestion(
  suggestion: DocumentLocationChange,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, suggestedLocation } = suggestion;
    await db
      .update(documents)
      .set({
        shelf: suggestedLocation.shelf,
        folder: suggestedLocation.folder,
      })
      .where(eq(documents.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error applying suggestion:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function applySuggestions(
  suggestions: DocumentLocationChange[],
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const suggestion of suggestions) {
      const result = await applySuggestion(suggestion);
      if (!result.success) {
        return result;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error applying suggestions:", error);
    return { success: false, error: (error as Error).message };
  }
}
