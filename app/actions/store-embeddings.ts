"use server";

import type { Document } from "@/app/types/document";
import { mastra } from "@/mastra";

export async function storeEmbeddings(document: Document) {
  try {
    const { start } = await mastra.getWorkflow("documentProcessingWorkflow").createRun();

    const result = await start({
      triggerData: {
        text: document.content,
        documentId: document.id,
      },
    });

    return {
      success: true,
      message: `Successfully stored embeddings for ${document.id}`,
      result,
    };
  } catch (error) {
    console.error("Error storing embeddings:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
