"use server";

import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeDocument } from "@/app/actions/analyse-document";
import { storeChunkEmbeddings } from "@/app/actions/document-processor";
import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { Document, DocumentResponse, DocumentsResponse } from "@/app/types/document";
import { generatePresignedUrl, minioClient } from "@/app/utils/minio";
import { mastra } from "@/mastra";
import { processAndStoreDocument } from "@/mastra/rag";
import { eq } from "drizzle-orm";
import { LlamaParseReader } from "llamaindex";

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

// Process and store a new document
export async function processDocument(file: {
  name: string;
  bucketName: string;
  objectKey: string;
  type: string;
}): Promise<DocumentResponse> {
  try {
    // Fetch and parse document
    const url = await generatePresignedUrl(file.bucketName, file.objectKey);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const tempPath = join(tmpdir(), file.name);
    await writeFile(tempPath, Buffer.from(buffer));

    const reader = new LlamaParseReader({ resultType: "text" });
    const parsedDocs = await reader.loadData(tempPath);
    const documentContent = parsedDocs[0];

    if (!documentContent) {
      return { success: false, error: "No content found in document" };
    }

    // Analyze document content
    const { title, tags } = await analyzeDocument(documentContent.text, file.name, file.type);

    const documentContentHash = createHash("sha256").update(documentContent.text).digest("hex");

    // Process embeddings for chunks
    const chunkEmneddingsResult = await storeChunkEmbeddings(documentContentHash, documentContent.text);
    if (!chunkEmneddingsResult.success) {
      console.error("Error processing chunk embeddings:", chunkEmneddingsResult.error);
    }
    // Calculate and save document embedding
    const documentEmbeddingResult = await calculateDocumentEmbedding(documentContentHash);
    if (!documentEmbeddingResult.success || !documentEmbeddingResult.embedding) {
      console.error("Error calculating document embedding:", documentEmbeddingResult.error);
      return { success: false, error: "Failed to calculate document embedding" };
    }

    const [savedDoc] = await db
      .insert(documents)
      .values({
        name: title || file.name,
        bucketName: file.bucketName,
        objectKey: file.objectKey,
        embedding: documentEmbeddingResult.embedding,
        documentContentHash,
        type: file.type,
        content: documentContent.text,
        tags,
      })
      .returning();

    return {
      success: true,
      data: {
        ...savedDoc,
        url: url, // Add the presigned URL for immediate use
      } as Document,
    };
  } catch (error) {
    console.error("Error processing document:", error);
    return { success: false, error: "Failed to process document" };
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

export async function getDocument(id: string): Promise<DocumentResponse> {
  try {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    const url = await generatePresignedUrl(doc.bucketName, doc.objectKey);

    return {
      success: true,
      data: {
        ...doc,
        url,
      } as Document,
    };
  } catch (error) {
    console.error("Error getting document:", error);
    return { success: false, error: "Failed to get document" };
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
