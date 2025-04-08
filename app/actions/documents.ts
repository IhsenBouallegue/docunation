"use server";

import { storeChunkEmbeddings } from "@/app/actions/document-processor";
import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { Document, DocumentResponse, DocumentsResponse } from "@/app/types/document";
import { generatePresignedUrl, minioClient } from "@/app/utils/minio";
import { mastra } from "@/mastra";
import { eq } from "drizzle-orm";

export async function getDocuments(): Promise<DocumentsResponse> {
  try {
    const documentsRecords = await db.select().from(documents);

    // Generate presigned URLs for each document and convert types
    const documentsWithUrls = await Promise.all(
      documentsRecords.map(async (doc) => ({
        id: doc.id,
        name: doc.name,
        bucketName: doc.bucketName,
        objectKey: doc.objectKey,
        type: doc.type,
        content: doc.content,
        url: await generatePresignedUrl(doc.bucketName, doc.objectKey),
        shelf: doc.shelf ?? undefined,
        folder: doc.folder ?? undefined,
        section: doc.section ?? undefined,
        tags: doc.tags as string[] | undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    );

    return { success: true, data: documentsWithUrls as Document[] };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// Delete a document and its associated data
export async function deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get document details first
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
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
        ...data,
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

    return {
      success: true,
      data: updatedDoc as Document,
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

export async function updateDocumentFolder(
  documentId: string,
  folder?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(documents).set({ folder }).where(eq(documents.id, documentId));
    return { success: true };
  } catch (error) {
    console.error("Error updating document folder:", error);
    return { success: false, error: "Failed to update document folder" };
  }
}
