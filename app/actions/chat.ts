"use server";

import { documentAgent } from "@/mastra/agents/documentAgent";

export async function generateChatResponse(query: string) {
  try {
    const response = await documentAgent.generate(`
      Please answer the following question using the context from my personal documents:
      ${query}
      
      Please base your answer only on the context provided by the vector query tool. 
      If the context doesn't contain enough information to fully answer the question, please state that explicitly.
    `);
    console.log(response);
    return {
      success: true,
      message: response.text,
      sources: response.sources,
    };
  } catch (error) {
    console.error("Error generating chat response:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate response",
    };
  }
}
