import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createPgVectorQueryTool } from "../rag";

/**
 * Document agent that uses RAG to answer questions based on document content
 */
export const documentAgent = new Agent({
  name: "Document Agent",
  instructions: `
    You are a helpful assistant that answers questions based on the provided document context.
    
    When responding to questions:
    - Base your answers only on the context provided by the vector query tool
    - If the context doesn't contain enough information to answer the question, state that explicitly
    - Keep your answers concise and relevant
    - Do not make up information that isn't in the provided context
    - If asked about personal information, be careful to only share what's in the documents
    - For form-filling questions, extract the relevant information from the documents
    
    Your primary purpose is to help users retrieve information from their personal documents and assist with form filling.
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    vectorQueryTool: createPgVectorQueryTool(),
  },
});

/**
 * Generate a response to a query using the document agent
 */
export async function generateResponse(query: string) {
  try {
    const prompt = `
      Please answer the following question using the context from my personal documents:
      ${query}
      
      Please base your answer only on the context provided by the vector query tool. 
      If the context doesn't contain enough information to fully answer the question, please state that explicitly.
    `;

    const completion = await documentAgent.generate(prompt);
    return completion.text;
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
