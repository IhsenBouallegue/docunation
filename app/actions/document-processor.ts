"use server";

import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeDocument } from "@/app/actions/analyse-document";
import { calculateDocumentEmbedding } from "@/app/actions/documents";
import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import { jobTracker } from "@/app/services/job-tracker";
import type { Document } from "@/app/types/document";
import { generatePresignedUrl, uploadFile } from "@/app/utils/minio";
import { auth } from "@/lib/auth";
import { processAndStoreDocument } from "@/mastra/rag";
import { LlamaParseReader } from "llamaindex";
import { headers } from "next/headers";

interface ProcessingStep<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Step 1: Get document content from file
async function getDocumentContent(file: File): Promise<ProcessingStep<{ content: string; buffer: Buffer }>> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join(tmpdir(), file.name);
    await writeFile(tempPath, buffer);

    const reader = new LlamaParseReader({ resultType: "text" });
    const parsedDocs = await reader.loadData(tempPath);
    const documentContent = parsedDocs[0];

    if (!documentContent) {
      return { success: false, error: "No content found in document" };
    }

    return {
      success: true,
      data: {
        content: documentContent.text,
        buffer,
      },
    };
  } catch (error) {
    console.error("Error extracting document content:", error);
    return { success: false, error: "Failed to extract document content" };
  }
}

// Step 2: Upload document with analyzed title
async function uploadDocumentWithMetadata(
  file: File,
  buffer: Buffer,
  content: string,
): Promise<ProcessingStep<{ bucketName: string; objectKey: string; title: string; tags: string[] }>> {
  try {
    // Analyze document to get title and tags
    const { title, tags } = await analyzeDocument(content, file.name, file.type);

    // Upload to MinIO with the analyzed title
    const { bucketName, objectKey } = await uploadFile(buffer, title || file.name, file.type);

    return {
      success: true,
      data: {
        bucketName,
        objectKey,
        title: title || file.name,
        tags,
      },
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { success: false, error: "Failed to upload document" };
  }
}

// Step 3: Process document chunks and store embeddings
async function processDocumentChunks(content: string): Promise<ProcessingStep<{ contentHash: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const contentHash = createHash("sha256").update(content).digest("hex");
    const result = await storeChunkEmbeddings(contentHash, content, session.user.id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: { contentHash },
    };
  } catch (error) {
    console.error("Error processing document chunks:", error);
    return { success: false, error: "Failed to process document chunks" };
  }
}

// Step 4: Generate document embedding
async function generateDocumentEmbedding(contentHash: string): Promise<ProcessingStep<number[]>> {
  try {
    const result = await calculateDocumentEmbedding(contentHash);

    if (!result.success || !result.embedding) {
      return { success: false, error: result.error || "Failed to calculate document embedding" };
    }

    return {
      success: true,
      data: result.embedding,
    };
  } catch (error) {
    console.error("Error generating document embedding:", error);
    return { success: false, error: "Failed to generate document embedding" };
  }
}

// Step 5: Store document in database
async function storeDocument(params: {
  name: string;
  bucketName: string;
  objectKey: string;
  embedding: number[];
  contentHash: string;
  type: string;
  content: string;
  tags: string[];
}): Promise<ProcessingStep<Document>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const [savedDoc] = await db
      .insert(documents)
      .values({
        name: params.name,
        bucketName: params.bucketName,
        objectKey: params.objectKey,
        embedding: params.embedding,
        documentContentHash: params.contentHash,
        type: params.type,
        content: params.content,
        tags: params.tags,
        userId: session.user.id,
      })
      .returning();

    const url = await generatePresignedUrl(params.bucketName, params.objectKey);

    return {
      success: true,
      data: {
        ...savedDoc,
        url,
      } as Document,
    };
  } catch (error) {
    console.error("Error storing document:", error);
    return { success: false, error: "Failed to store document in database" };
  }
}

export async function storeChunkEmbeddings(documentContentHash: string, content: string, userId: string) {
  try {
    const { totalChunks, totalEmbeddings } = await processAndStoreDocument(content, documentContentHash, userId);

    if (!totalChunks || !totalEmbeddings) {
      return { success: false, error: "Failed to process and store document" };
    }

    return { success: true, totalChunks, totalEmbeddings };
  } catch (error) {
    console.error("Error processing embeddings:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function processDocumentStream(formData: FormData, jobId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    // Step 1: Get document content
    jobTracker.updateJob(jobId, {
      status: "extracting_content",
      step: 1,
      message: "Extracting document content",
      progress: 0,
    });
    const contentStep = await getDocumentContent(file);
    if (!contentStep.success || !contentStep.data) {
      throw new Error(contentStep.error || "Failed to extract document content");
    }

    // Step 2: Upload document with metadata
    jobTracker.updateJob(jobId, {
      status: "uploading_document",
      step: 2,
      message: "Uploading document",
      progress: 20,
    });
    const uploadStep = await uploadDocumentWithMetadata(file, contentStep.data.buffer, contentStep.data.content);
    if (!uploadStep.success || !uploadStep.data) {
      throw new Error(uploadStep.error || "Failed to upload document");
    }

    // Step 3: Process document chunks and store embeddings
    jobTracker.updateJob(jobId, {
      status: "processing_chunks",
      step: 3,
      message: "Processing document chunks",
      progress: 40,
    });
    const chunksStep = await processDocumentChunks(contentStep.data.content);
    if (!chunksStep.success || !chunksStep.data) {
      throw new Error(chunksStep.error || "Failed to process document chunks");
    }

    // Step 4: Generate document embedding
    jobTracker.updateJob(jobId, {
      status: "generating_embedding",
      step: 4,
      message: "Generating document embedding",
      progress: 60,
    });
    const embeddingStep = await generateDocumentEmbedding(chunksStep.data.contentHash);
    if (!embeddingStep.success || !embeddingStep.data) {
      throw new Error(embeddingStep.error || "Failed to generate document embedding");
    }

    // Step 5: Store document in the database
    jobTracker.updateJob(jobId, {
      status: "storing_document",
      step: 5,
      message: "Storing document in database",
      progress: 80,
    });
    const storeStep = await storeDocument({
      name: uploadStep.data.title,
      bucketName: uploadStep.data.bucketName,
      objectKey: uploadStep.data.objectKey,
      embedding: embeddingStep.data,
      contentHash: chunksStep.data.contentHash,
      type: file.type,
      content: contentStep.data.content,
      tags: uploadStep.data.tags,
    });

    if (!storeStep.success || !storeStep.data) {
      throw new Error(storeStep.error || "Failed to store document");
    }

    // Complete the job with the final document
    jobTracker.completeJob(jobId, storeStep.data);
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}
