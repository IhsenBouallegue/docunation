"use server";

import { mastra } from "@/mastra";
import type { Document } from "@/app/types/document";

export async function getDocumentChunks(documents: Document[]) {
  try {
    const vectorStore = mastra.getVector("pgVector");
    const allChunks = await Promise.all(
      documents.map(async (doc) => {
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