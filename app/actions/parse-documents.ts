"use server";

import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mastra } from "@/mastra";
import { LlamaParseReader } from "llamaindex";

export interface ParsedDocument {
  id: string;
  content: string;
  metadata: {
    fileName: string;
    file_path?: string;
    [key: string]: string | undefined;
  };
}

export async function parseDocuments(formData: FormData) {
  try {
    const files = formData.getAll("files") as File[];
    const results: ParsedDocument[] = [];

    for (const file of files) {
      // Create a temporary file path
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempPath = join(tmpdir(), file.name);

      // Write the file to temp directory
      await writeFile(tempPath, buffer);

      // Parse the document using LlamaIndex
      const reader = new LlamaParseReader({ resultType: "markdown" });
      const documents = await reader.loadData(tempPath);

      // Convert LlamaIndex Document objects to plain objects and store embeddings
      for (const doc of documents) {
        const parsedDoc: ParsedDocument = {
          id: doc.id_,
          content: doc.text,
          metadata: {
            fileName: file.name,
            ...doc.metadata,
          },
        };
        results.push(parsedDoc);

        // Store embeddings using Mastra's workflow
        const { runId, start } = await mastra.getWorkflow("documentProcessingWorkflow").createRun();

        await start({
          triggerData: {
            text: parsedDoc.content,
            title: parsedDoc.metadata.fileName,
          },
        });
      }

      console.log("Processed document:", file.name);
    }

    return {
      success: true,
      results,
      message: `Successfully processed ${results.length} documents`,
    };
  } catch (error) {
    console.error("Error processing documents:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
