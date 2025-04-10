"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { DocumentLocationChange } from "@/app/types/organization";
import { assignmentsToClusters, kmeans } from "@/app/utils/kmeans";
import { asc, eq, isNull } from "drizzle-orm";

// ========== Constants ==========
const SIMILARITY_THRESHOLD = 0.5;

// ========== Helpers ==========
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

// ========== Core Functions ==========
export async function suggestDocumentLocations(
  forceReorganize = false,
): Promise<{ success: boolean; suggestions?: DocumentLocationChange[]; error?: string }> {
  try {
    // Get all documents with embeddings
    const allDocs = await db.query.documents.findMany({
      where: forceReorganize ? undefined : isNull(documents.folderId),
      with: {
        folder: {
          with: {
            shelf: true,
          },
        },
      },
      orderBy: asc(documents.createdAt),
    });

    if (allDocs.length === 0) {
      return { success: true, suggestions: [] };
    }

    // Get existing folders
    const existingFolders = await db.query.folders.findMany({
      with: {
        documents: true,
        shelf: true,
      },
    });

    if (existingFolders.length === 0) {
      return { success: false, error: "No folders found. Please create at least one folder first." };
    }

    const folderCentroids = new Map<string, { centroid: number[]; shelfName: string; folderName: string }>();

    if (forceReorganize) {
      // When force reorganizing, cluster all documents and assign them to folders
      const embeddings = allDocs.map((doc) => doc.embedding);
      const k = Math.min(existingFolders.length, allDocs.length);
      const clusters = clusterDocuments(embeddings, k, 42);
      const documentGroups = groupDocsByCluster(allDocs, clusters);

      // Assign each cluster to a folder
      for (let i = 0; i < documentGroups.length; i++) {
        const folder = existingFolders[i];
        const docs = documentGroups[i];
        if (docs.length > 0) {
          folderCentroids.set(folder.id, {
            centroid: calculateCentroid(docs.map((doc) => doc.embedding)),
            shelfName: folder.shelf.name,
            folderName: folder.name,
          });
        }
      }
    } else {
      // For normal organization, use existing folder contents
      for (const folder of existingFolders) {
        const embeddings = folder.documents
          .map((doc) => doc.embedding)
          .filter((emb): emb is number[] => emb !== null && emb.length > 0);

        // For empty folders, use the average of all document embeddings as a starting point
        if (embeddings.length === 0) {
          const avgEmbedding = calculateCentroid(allDocs.map((doc) => doc.embedding));
          folderCentroids.set(folder.id, {
            centroid: avgEmbedding,
            shelfName: folder.shelf.name,
            folderName: folder.name,
          });
        } else {
          folderCentroids.set(folder.id, {
            centroid: calculateCentroid(embeddings),
            shelfName: folder.shelf.name,
            folderName: folder.name,
          });
        }
      }
    }

    // Process documents
    const suggestions: DocumentLocationChange[] = [];

    for (const doc of allDocs) {
      // Find the most similar folder
      let bestFolderId: string | null = null;
      let bestSimilarity = -1;
      let bestFolder: { shelfName: string; folderName: string } | null = null;

      for (const [folderId, { centroid, shelfName, folderName }] of folderCentroids.entries()) {
        const similarity = calculateCosineSimilarity(doc.embedding, centroid);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestFolderId = folderId;
          bestFolder = { shelfName, folderName };
        }
      }

      // For empty folders or force reorganize, we'll suggest changes even if similarity is low
      if (bestFolderId && bestFolderId !== doc.folderId && (bestSimilarity > SIMILARITY_THRESHOLD || forceReorganize)) {
        suggestions.push({
          id: doc.id,
          name: doc.name,
          currentFolderId: doc.folderId,
          suggestedFolderId: bestFolderId,
          currentLocation: doc.folder
            ? {
                shelfName: doc.folder.shelf.name,
                folderName: doc.folder.name,
              }
            : undefined,
          suggestedLocation: bestFolder ?? undefined,
        });
      }
    }

    return { success: true, suggestions };
  } catch (error) {
    console.error("Error suggesting document locations:", error);
    return { success: false, error: (error as Error).message };
  }
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function applySuggestion(
  suggestion: DocumentLocationChange,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, suggestedFolderId } = suggestion;

    if (suggestedFolderId === null) {
      return { success: false, error: "No suggested folder provided" };
    }

    await db
      .update(documents)
      .set({
        folderId: suggestedFolderId,
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

function calculateCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) throw new Error("Cannot calculate centroid of empty vector set");

  const dim = vectors[0].length;
  const centroid = new Array(dim).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += vector[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= vectors.length;
  }

  return centroid;
}
