"use server";

import { auth } from "@/lib/auth";
import { documentAgent } from "@/mastra/agents/documentAgent";
import { headers } from "next/headers";
// should only use the queries with the userId
export async function generateChatResponse(query: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }
  try {
    const response = await documentAgent.generate(`
      Please answer the following question using the context from my personal documents:
      ${query}
      
      Please base your answer only on the context provided by the vector query tool. 
      If the context doesn't contain enough information to fully answer the question, please state that explicitly.
      Only use the documents that are related to the user and have the userId "${session.user.id}" in the metadata.
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
