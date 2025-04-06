"use server";

import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { Document, DocumentResponse, DocumentsResponse } from "@/app/types/document";
import { generatePresignedUrl, minioClient } from "@/app/utils/minio";
import { mastra } from "@/mastra";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { eq } from "drizzle-orm";
import { LlamaParseReader } from "llamaindex";
import { z } from "zod";

// Create an agent for document processing
const processAgent = new Agent({
  name: "Document Processor",
  model: openai("gpt-4-turbo-preview"),
  instructions: `You are a document processing assistant that analyzes documents and extracts key information.
  
  For titles:
  - Create a clear, descriptive title if none exists
  - Keep it concise but informative
  - Include key topic and document type
  
  For tags:
  - Extract 3-5 key topics or themes
  - Focus on main concepts, not generic terms
  - Include document type if relevant
  - Make tags concise (1-3 words)`,
});

interface ProcessResult {
  title: string;
  tags: string[];
}

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

    return { success: true, data: documentsWithUrls };
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

    const reader = new LlamaParseReader({ resultType: "markdown" });
    const parsedDocs = await reader.loadData(tempPath);
    const documentContent = parsedDocs[0];

    if (!documentContent) {
      return { success: false, error: "No content found in document" };
    }

    // Analyze document content
    const { title, tags } = await analyzeDocument(documentContent.text, file.name, file.type);

    // Save document with MinIO metadata
    const [savedDoc] = await db
      .insert(documents)
      .values({
        name: title || file.name,
        bucketName: file.bucketName,
        objectKey: file.objectKey,
        type: file.type,
        content: documentContent.text,
        tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Process embeddings for chunks
    const embeddingResult = await processEmbeddings(savedDoc as Document);
    if (!embeddingResult.success) {
      console.error("Error processing chunk embeddings:", embeddingResult.error);
    }

    // Calculate and save document embedding
    const documentEmbeddingResult = await calculateDocumentEmbedding(savedDoc.id);
    if (!documentEmbeddingResult.success) {
      console.error("Error calculating document embedding:", documentEmbeddingResult.error);
    }

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
      filter: { documentId },
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
      await processEmbeddings(updatedDoc as Document);
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

// Get document chunks with embeddings
export async function getDocumentChunks(docs: Document[]) {
  try {
    const vectorStore = mastra.getVector("pgVector");
    const allChunks = await Promise.all(
      docs.map(async (doc) => {
        const results = await vectorStore.query({
          indexName: "embeddings",
          filter: { documentId: doc.id },
          includeVector: true,
          topK: 1000,
          queryVector: Array(1536).fill(0),
        });
        return results;
      }),
    );

    return {
      success: true,
      chunks: allChunks.flat().map((chunk) => ({
        text: chunk.metadata?.text ?? "",
        metadata: { documentId: chunk.metadata?.documentId },
        vector: chunk.vector ?? [],
      })),
    };
  } catch (error) {
    console.error("Error fetching document chunks:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Calculate document embedding
export async function calculateDocumentEmbedding(documentId: string) {
  try {
    const vectorStore = mastra.getVector("pgVector");
    const results = await vectorStore.query({
      indexName: "embeddings",
      filter: { documentId },
      includeVector: true,
      topK: 1000,
      queryVector: Array(1536).fill(0),
    });

    if (!results.length) {
      return { success: false, error: "No chunks found for document" };
    }

    const embeddingLength = results[0]?.vector?.length ?? 0;
    const averageEmbedding = new Array(embeddingLength).fill(0);

    for (const result of results) {
      for (let i = 0; i < embeddingLength; i++) {
        averageEmbedding[i] += result.vector?.[i] ?? 0;
      }
    }

    for (let i = 0; i < embeddingLength; i++) {
      averageEmbedding[i] /= results.length;
    }

    await db
      .update(documents)
      .set({
        embedding: averageEmbedding,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    return {
      success: true,
      chunkCount: results.length,
      embeddingDimension: embeddingLength,
    };
  } catch (error) {
    console.error("Error calculating document embedding:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Private helper functions
async function analyzeDocument(content: string, fileName: string, type: string): Promise<ProcessResult> {
  const prompt = `
  Analyze this document:
  Name: ${fileName}
  Type: ${type}
  Content: ${content}

  1. Create a clear, descriptive title for this document.
  2. Extract 3-5 relevant tags that describe the key topics and themes.

  Return the results in this format:
  TITLE: [your suggested title]
  TAGS: [tag1], [tag2], [tag3]
  `;

  const response = await processAgent.generate([{ role: "user", content: prompt }], {
    output: z.object({
      title: z.string(),
      tags: z.array(z.string()),
    }),
  });

  return {
    title: response.object.title,
    tags: response.object.tags,
  };
}

async function processEmbeddings(document: Document) {
  try {
    const { start } = await mastra.getWorkflow("documentProcessingWorkflow").createRun();
    await start({
      triggerData: {
        text: document.content,
        documentId: document.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error processing embeddings:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateDocumentFolder(documentId: string, folder: string | undefined) {
  return updateDocument(documentId, { folder });
}
