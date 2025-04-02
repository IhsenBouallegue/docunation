"use server";

import { mastra } from "@/mastra";

interface ParsedDocument {
  id: string;
  content: string;
  metadata: {
    fileName: string;
    [key: string]: string | undefined;
  };
}

export async function storeEmbeddings(documents: ParsedDocument[]) {
  try {
    // Process each document through Mastra's document processing workflow
    const embeddingPromises = documents.map(async (doc) => {
      const { runId, start } = await mastra.getWorkflow("documentProcessingWorkflow").createRun();

      const result = await start({
        triggerData: {
          text: doc.content,
          title: doc.metadata.fileName,
        },
      });

      return result;
    });

    const results = await Promise.all(embeddingPromises);

    return {
      success: true,
      message: `Successfully stored embeddings for ${results.length} documents`,
      results,
    };
  } catch (error) {
    console.error("Error storing embeddings:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
