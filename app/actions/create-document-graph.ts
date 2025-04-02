"use server";

import type { Document } from "@/app/types/document";
import { GraphRAG } from "@mastra/rag";
import { getDocumentChunks } from "./get-document-chunks";

export async function createDocumentGraph(documents: Document[]) {
  try {
    // Get chunks from vector store
    const chunksResult = await getDocumentChunks(documents);
    if (!chunksResult.success || !chunksResult.chunks) {
      throw new Error(chunksResult.error);
    }

    // Initialize GraphRAG
    const graph = new GraphRAG(1536, 0.7);

    // Create graph nodes and edges
    const chunks = chunksResult.chunks.map((chunk) => ({
      text: chunk.text,
      metadata: chunk.metadata,
    }));
    const embeddings = chunksResult.chunks.map((chunk) => ({ vector: chunk.vector }));

    // Create the graph
    graph.createGraph(chunks, embeddings);

    // Convert to reagraph format
    const nodes = documents.map((doc) => ({
      id: doc.id,
      label: doc.name,
    }));

    const edges = graph.getEdges().map((edge) => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
    }));

    return {
      success: true,
      nodes,
      edges,
    };
  } catch (error) {
    console.error("Error creating document graph:", error);
    return { success: false, error: (error as Error).message };
  }
}
