"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import { GraphRAG } from "@mastra/rag";

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export async function createDocumentGraph(): Promise<{ success: boolean; data?: GraphData; error?: string }> {
  try {
    // Get all documents with their embeddings
    const docs = await db.select().from(documents);

    // Filter out documents without embeddings
    const docsWithEmbeddings = docs.filter(
      (doc): doc is typeof doc & { embedding: number[] } => doc.embedding !== null && doc.embedding.length > 0,
    );

    if (docsWithEmbeddings.length === 0) {
      // Return empty graph data instead of error when no documents with embeddings are found
      return {
        success: true,
        data: {
          nodes: [],
          links: [],
        },
      };
    }

    // Initialize GraphRAG
    const graph = new GraphRAG(1536, 0.7);

    // Create graph nodes and edges using document embeddings
    const embeddings = docsWithEmbeddings.map((doc) => ({
      vector: doc.embedding,
      text: doc.name,
      metadata: { documentId: doc.id },
    }));

    // Create the graph
    graph.createGraph(embeddings, embeddings);

    // Get edges and normalize weights for better visualization
    const edges = graph.getEdges();
    const maxWeight = Math.max(...edges.map((edge) => edge.weight));
    const minWeight = Math.min(...edges.map((edge) => edge.weight));

    // Transform data for react-force-graph
    const nodes: GraphNode[] = docsWithEmbeddings.map((doc) => ({
      id: doc.id,
      name: doc.name,
      val: 1, // Base size for all nodes
      color: "#3b82f6", // Blue color for nodes
    }));

    const links: GraphLink[] = edges.map((edge) => {
      // Get the actual document IDs from the embeddings array
      const sourceDoc = docsWithEmbeddings[Number.parseInt(edge.source)];
      const targetDoc = docsWithEmbeddings[Number.parseInt(edge.target)];

      // Calculate normalized weight, handling edge cases
      const normalizedWeight =
        maxWeight === minWeight
          ? 0.5 // If all weights are the same, use middle value
          : (edge.weight - minWeight) / (maxWeight - minWeight);

      return {
        source: sourceDoc.id,
        target: targetDoc.id,
        value: normalizedWeight,
        color: "#94a3b8", // Slate color for links
      };
    });

    return {
      success: true,
      data: { nodes, links },
    };
  } catch (error) {
    console.error("Error creating document graph:", error);
    return { success: false, error: (error as Error).message };
  }
}
