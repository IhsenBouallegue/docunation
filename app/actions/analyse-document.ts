"use server";

import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
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

// Private helper functions
export async function analyzeDocument(
  content: string,
  fileName: string,
  type: string,
): Promise<{ title: string; tags: string[] }> {
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
