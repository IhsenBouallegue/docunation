// app/actions/calculate-document-embedding.ts
"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import { mastra } from "@/mastra";
import { eq } from "drizzle-orm";

export async function calculateDocumentEmbedding(documentId: string) {
  try {
    console.log(`Starting document embedding calculation for document ${documentId}`);
    const vectorStore = mastra.getVector("pgVector");

    // Use Mastra's vector query API to get chunks with their embeddings
    const results = await vectorStore.query({
      indexName: "embeddings",
      filter: { documentId }, // This will filter chunks by document ID
      includeVector: true, // This ensures we get the embeddings back
      topK: 1000, // Make sure we get all chunks for the document
      queryVector: Array(1536).fill(0), // This is a placeholder for the query vector
    });

    console.log(`Found ${results.length} chunks for document ${documentId}`);

    if (!results.length) {
      console.log(`No chunks found for document ${documentId}`);
      return { success: false, error: "No chunks found for document" };
    }

    // Calculate average embedding from the chunks
    const embeddingLength = results[0]?.vector?.length ?? 0;
    console.log(`Embedding dimension: ${embeddingLength}`);

    const averageEmbedding = new Array(embeddingLength).fill(0);

    for (const result of results) {
      for (let i = 0; i < embeddingLength; i++) {
        averageEmbedding[i] += result.vector?.[i] ?? 0;
      }
    }

    for (let i = 0; i < embeddingLength; i++) {
      averageEmbedding[i] /= results.length;
    }

    console.log(`Calculated average embedding for document ${documentId}`);

    // Update document with new embedding
    await db
      .update(documents)
      .set({
        embedding: averageEmbedding,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.log(`Successfully updated document ${documentId} with new embedding`);

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
