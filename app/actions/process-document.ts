"use server";

import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { Document, DocumentResponse } from "@/app/types/document";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { MDocument } from "@mastra/rag";
import { eq } from "drizzle-orm";
import { LlamaParseReader } from "llamaindex";
import { z } from "zod";
import { storeEmbeddings } from "./store-embeddings";

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

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface ProcessResult {
  title: string;
  tags: string[];
}

// Process the document to extract title and tags
async function analyzeDocument(content: string, fileName: string, type: string): Promise<ProcessResult> {
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

export async function processDocument(file: UploadedFile): Promise<DocumentResponse> {
  try {
    // Fetch the file content from the URL
    const response = await fetch(file.url);
    const buffer = await response.arrayBuffer();

    // Create a temporary file
    const tempPath = join(tmpdir(), file.name);
    await writeFile(tempPath, Buffer.from(buffer));

    // Parse the document using LlamaIndex
    const reader = new LlamaParseReader({ resultType: "markdown" });
    const parsedDocs = await reader.loadData(tempPath);

    // Process the first document
    const doc = parsedDocs[0];
    if (!doc) {
      return { success: false, error: "No content found in document" };
    }

    // Create chunks from the parsed content
    const mDoc = MDocument.fromText(doc.text);
    const chunks = await mDoc.chunk({
      strategy: "recursive",
      size: 512,
      overlap: 50,
      separator: "\n",
    });

    // Store embeddings using the existing storeEmbeddings function
    const parsedDocument = {
      id: doc.id_,
      content: doc.text,
      metadata: {
        fileName: file.name,
        file_type: doc.metadata.file_type || file.type,
      },
    };

    const embeddingResult = await storeEmbeddings([parsedDocument]);
    if (!embeddingResult.success) {
      return { success: false, error: embeddingResult.error };
    }

    // Analyze document to get title and tags
    const { title, tags } = await analyzeDocument(doc.text, file.name, doc.metadata.file_type || file.type);
    console.log("title", title);
    console.log("tags", tags);
    // Save to database
    try {
      const [savedDoc] = await db
        .insert(documents)
        .values({
          name: title || file.name, // Use generated title if available
          url: file.url,
          type: doc.metadata.file_type || file.type,
          content: doc.text,
          tags,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        document: savedDoc as Document,
      };
    } catch (error) {
      console.error("Error saving document:", error);
      return { success: false, error: "Failed to save document" };
    }
  } catch (error) {
    console.error("Error processing document:", error);
    return { success: false, error: "Failed to process document" };
  }
}
