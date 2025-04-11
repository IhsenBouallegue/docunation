import { openai } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";
import { MDocument, createVectorQueryTool } from "@mastra/rag";
import { embedMany } from "ai";

// Initialize PgVector with the connection string
// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const pgVector = new PgVector(process.env.POSTGRES_CONNECTION_STRING!);

/**
 * Process a text document and split it into chunks
 */
export async function chunkDocument(text: string) {
  try {
    // Create a document from the text
    const doc = MDocument.fromText(text);

    // Chunk the document
    const chunks = await doc.chunk({
      strategy: "recursive",
      size: 512,
      overlap: 50,
      separator: "\n",
    });

    return {
      chunks,
      totalChunks: chunks.length,
    };
  } catch (error) {
    console.error("Error processing document:", error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate embeddings for document chunks and store them in PostgreSQL
 */
export async function generateAndStoreEmbeddings(
  chunks: { text: string }[],
  documentContentHash: string,
  userId: string,
) {
  try {
    // Generate embeddings for the chunks
    const { embeddings } = await embedMany({
      values: chunks.map((chunk) => chunk.text),
      model: openai.embedding("text-embedding-3-small"),
    });

    // Create the index if it doesn't exist (1536 is the dimension for OpenAI embeddings)
    await pgVector.createIndex({
      indexName: "embeddings",
      dimension: 1536,
      metric: "cosine",
    });

    // Store the embeddings with metadata
    await pgVector.upsert({
      indexName: "embeddings",
      vectors: embeddings,
      metadata: chunks.map((chunk) => ({
        text: chunk.text,
        documentContentHash,
        createdAt: new Date(),
        userId,
      })),
    });

    return {
      totalEmbeddings: embeddings.length,
    };
  } catch (error) {
    console.error("Error generating and storing embeddings:", error);
    throw new Error(
      `Failed to generate and store embeddings: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Create a vector query tool for PostgreSQL
 */
export function createPgVectorQueryTool() {
  return createVectorQueryTool({
    vectorStoreName: "pgVector",
    indexName: "embeddings",
    model: openai.embedding("text-embedding-3-small"),
    enableFilter: true,
  });
}

/**
 * Process a document, generate embeddings, and store them in PostgreSQL
 */
export async function processAndStoreDocument(text: string, documentContentHash: string, userId: string) {
  try {
    // Process the document
    const { chunks } = await chunkDocument(text);

    // Generate and store embeddings
    const { totalEmbeddings } = await generateAndStoreEmbeddings(chunks, documentContentHash, userId);

    return {
      totalChunks: chunks.length,
      totalEmbeddings,
    };
  } catch (error) {
    console.error("Error processing and storing document:", error);
    throw new Error(`Failed to process and store document: ${error instanceof Error ? error.message : String(error)}`);
  }
}
