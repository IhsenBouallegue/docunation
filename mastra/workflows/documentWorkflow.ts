import { auth } from "@/lib/auth";
import { Step } from "@mastra/core";
import { Workflow } from "@mastra/core/workflows";
import { headers } from "next/headers";
import { z } from "zod";
import { documentAgent } from "../agents/documentAgent";
import { processAndStoreDocument } from "../rag";

// Step to process and store a document
const processDocumentStep = new Step({
  id: "process-document",
  description: "Process a document and store it in the vector database",
  inputSchema: z.object({
    text: z.string().describe("The text content of the document"),
    documentContentHash: z.string().describe("The hash of the document content"),
  }),
  execute: async ({ context }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }
    const triggerData = context?.getStepResult<{ text: string; documentContentHash: string }>("trigger");

    if (!triggerData) {
      throw new Error("Trigger data not found");
    }

    const { text, documentContentHash } = triggerData;

    // Process and store the document
    const result = await processAndStoreDocument(text, documentContentHash, session.user.id);

    return {
      totalChunks: result.totalChunks,
      totalEmbeddings: result.totalEmbeddings,
      message: `Successfully processed and stored document with ${result.totalChunks} chunks.`,
    };
  },
});

// Document processing workflow
export const documentProcessingWorkflow = new Workflow({
  name: "document-processing-workflow",
  triggerSchema: z.object({
    text: z.string().describe("The text content of the document"),
    documentContentHash: z.string().describe("The hash of the document content"),
  }),
}).step(processDocumentStep);

documentProcessingWorkflow.commit();

// ================================================

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

// Document querying workflow
export const documentQueryWorkflow = new Workflow({
  name: "document-query-workflow",
  triggerSchema: z.object({
    query: z.string().describe("The query to search for in the documents"),
  }),
}).step(queryDocumentStep);

// Commit the workflows
documentQueryWorkflow.commit();
