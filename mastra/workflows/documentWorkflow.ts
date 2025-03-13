import { Step } from "@mastra/core";
import { Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { documentAgent } from "../agents/documentAgent";
import { processAndStoreDocument } from "../rag";

// Step to process and store a document
const processDocumentStep = new Step({
  id: "process-document",
  description: "Process a document and store it in the vector database",
  inputSchema: z.object({
    text: z.string().describe("The text content of the document"),
    title: z.string().optional().describe("Optional title of the document"),
  }),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ text: string; title?: string }>("trigger");

    if (!triggerData) {
      throw new Error("Trigger data not found");
    }

    const { text, title = "Untitled Document" } = triggerData;

    // Process and store the document
    const result = await processAndStoreDocument(text, title);

    return {
      title: result.title,
      totalChunks: result.totalChunks,
      totalEmbeddings: result.totalEmbeddings,
      message: `Successfully processed and stored document "${result.title}" with ${result.totalChunks} chunks.`,
    };
  },
});

// Step to query documents
const queryDocumentStep = new Step({
  id: "query-document",
  description: "Query documents using RAG",
  inputSchema: z.object({
    query: z.string().describe("The query to search for in the documents"),
  }),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ query: string }>("trigger");

    if (!triggerData) {
      throw new Error("Trigger data not found");
    }

    const { query } = triggerData;

    // Generate a response using the document agent
    const prompt = `
      Please answer the following question using the context from my personal documents:
      ${query}
      
      Please base your answer only on the context provided by the vector query tool. 
      If the context doesn't contain enough information to fully answer the question, please state that explicitly.
    `;

    const completion = await documentAgent.generate(prompt);

    return {
      query,
      response: completion.text,
    };
  },
});

// Document processing workflow
export const documentProcessingWorkflow = new Workflow({
  name: "document-processing-workflow",
  triggerSchema: z.object({
    text: z.string().describe("The text content of the document"),
    title: z.string().optional().describe("Optional title of the document"),
  }),
}).step(processDocumentStep);

// Document querying workflow
export const documentQueryWorkflow = new Workflow({
  name: "document-query-workflow",
  triggerSchema: z.object({
    query: z.string().describe("The query to search for in the documents"),
  }),
}).step(queryDocumentStep);

// Commit the workflows
documentProcessingWorkflow.commit();
documentQueryWorkflow.commit();
