"use server";

import { mastra } from "@/mastra";

export async function queryDocuments(query: string) {
  try {
    const agent = mastra.getAgent("documentAgent");
    const result = await agent.generate(query);

    return {
      success: true,
      answer: result.text,
      sources: result.sources,
    };
  } catch (error) {
    console.error("Error querying documents:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
