"use server";

import { storeChunkEmbeddings } from "@/app/actions/document-processor";
import { db } from "@/app/db";
import { documents, shelves } from "@/app/db/schema";
import type { Document, DocumentResponse, DocumentsResponse } from "@/app/types/document";
import { generatePresignedUrl, minioClient } from "@/app/utils/minio";
import { mastra } from "@/mastra";
import { asc, eq } from "drizzle-orm";

async function getDocumentWithRelations(documentId: string) {
  return db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
}

// Utility function to fetch documents with relations
async function getDocumentsWithRelations() {
  return db.query.documents.findMany({
    orderBy: asc(documents.createdAt),
  });
}

export async function getDocuments(): Promise<DocumentsResponse> {
  try {
    const documentsRecords = await getDocumentsWithRelations();

    // Generate presigned URLs for each document and convert types
    const documentsWithUrls = await Promise.all(
      documentsRecords.map(async (doc) => ({
        ...doc,
        url: await generatePresignedUrl(doc.bucketName, doc.objectKey),
      })),
    );

    return { success: true, data: documentsWithUrls };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// Delete a document and its associated data
export async function deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get document details first
    const doc = await getDocumentWithRelations(documentId);

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    // Delete document embeddings from vector store
    const vectorStore = mastra.getVector("pgVector");
    const chunks = await vectorStore.query({
      indexName: "embeddings",
      filter: { documentContentHash: doc.documentContentHash },
      includeVector: true,
      topK: 1000,
      queryVector: Array(1536).fill(0),
    });

    // Delete each chunk embedding individually
    for (const chunk of chunks) {
      if (chunk.id) {
        await vectorStore.deleteIndexById("embeddings", chunk.id);
      }
    }

    // Delete the file from MinIO
    await minioClient.removeObject(doc.bucketName, doc.objectKey);

    // Delete document from database
    await db.delete(documents).where(eq(documents.id, documentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Update an existing document
export async function updateDocument(documentId: string, data: Partial<Document>): Promise<DocumentResponse> {
  try {
    const [updatedDoc] = await db
      .update(documents)
      .set({
        name: data.name,
        section: data.section ?? null,
        tags: data.tags ?? null,
        folderId: data.folderId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))
      .returning();

    if (!updatedDoc) {
      return { success: false, error: "Document not found" };
    }

    // If content was updated, reprocess embeddings
    if (data.content) {
      await storeChunkEmbeddings(updatedDoc.documentContentHash, data.content);
    }

    // Fetch the complete document with relations
    const completeDoc = await getDocumentWithRelations(documentId);

    if (!completeDoc) {
      return { success: false, error: "Failed to fetch updated document" };
    }

    return {
      success: true,
      data: {
        ...completeDoc,
        url: await generatePresignedUrl(completeDoc.bucketName, completeDoc.objectKey),
      },
    };
  } catch (error) {
    console.error("Error updating document:", error);
    return { success: false, error: "Failed to update document" };
  }
}

// Calculate document embedding
export async function calculateDocumentEmbedding(documentContentHash: string) {
  try {
    const vectorStore = mastra.getVector("pgVector");
    const results = await vectorStore.query({
      indexName: "embeddings",
      filter: { documentContentHash },
      includeVector: true,
      topK: 1000,
      queryVector: Array(1536).fill(0),
    });

    if (!results.length) {
      return { success: false, error: "No chunks found for document" };
    }

    const embeddingLength = results[0]?.vector?.length ?? 0;
    const averageEmbedding: number[] = new Array(1536).fill(0);

    for (const result of results) {
      for (let i = 0; i < embeddingLength; i++) {
        averageEmbedding[i] += result.vector?.[i] ?? 0;
      }
    }

    for (let i = 0; i < embeddingLength; i++) {
      averageEmbedding[i] /= results.length;
    }

    return {
      success: true,
      embedding: averageEmbedding,
      chunkCount: results.length,
      embeddingDimension: embeddingLength,
    };
  } catch (error) {
    console.error("Error calculating document embedding:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Update document folder
export async function updateDocumentFolder(documentId: string, folderId: string | null): Promise<DocumentResponse> {
  try {
    await db.update(documents).set({ folderId }).where(eq(documents.id, documentId));

    // Fetch the updated document with relations
    const updatedDoc = await getDocumentWithRelations(documentId);

    if (!updatedDoc) {
      return { success: false, error: "Failed to fetch updated document" };
    }

    return {
      success: true,
      data: {
        ...updatedDoc,
        url: await generatePresignedUrl(updatedDoc.bucketName, updatedDoc.objectKey),
      },
    };
  } catch (error) {
    console.error("Error updating document folder:", error);
    return { success: false, error: "Failed to update document folder" };
  }
}

export async function getShelvesWithFoldersAndDocuments() {
  return db.query.shelves.findMany({
    with: {
      folders: {
        with: {
          documents: true,
        },
      },
    },
    orderBy: asc(shelves.createdAt),
  });
}
