"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import { GraphRAG } from "@mastra/rag";

interface DocumentCluster {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
  }>;
}

export async function clusterDocuments(): Promise<{ success: boolean; clusters?: DocumentCluster[]; error?: string }> {
  try {
    // Get all documents with their embeddings
    const docs = await db.select().from(documents);

    // Filter out documents without embeddings
    const docsWithEmbeddings = docs.filter(
      (doc): doc is typeof doc & { embedding: number[] } => doc.embedding !== null && doc.embedding.length > 0,
    );

    if (docsWithEmbeddings.length === 0) {
      return { success: false, error: "No documents with embeddings found" };
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

    // Get edges and create a graph for Louvain clustering
    const edges = graph.getEdges();
    const maxWeight = Math.max(...edges.map((edge) => edge.weight));
    const minWeight = Math.min(...edges.map((edge) => edge.weight));

    // Create a graph for Louvain clustering
    const louvainGraph = new Map<string, Map<string, number>>();

    // Initialize nodes
    for (const doc of docsWithEmbeddings) {
      louvainGraph.set(doc.id, new Map());
    }

    // Add edges with normalized weights
    for (const edge of edges) {
      const sourceDoc = docsWithEmbeddings[Number.parseInt(edge.source)];
      const targetDoc = docsWithEmbeddings[Number.parseInt(edge.target)];

      if (!sourceDoc || !targetDoc) continue;

      const normalizedWeight = maxWeight === minWeight ? 0.5 : (edge.weight - minWeight) / (maxWeight - minWeight);

      const sourceNeighbors = louvainGraph.get(sourceDoc.id);
      const targetNeighbors = louvainGraph.get(targetDoc.id);

      if (sourceNeighbors && targetNeighbors) {
        sourceNeighbors.set(targetDoc.id, normalizedWeight);
        targetNeighbors.set(sourceDoc.id, normalizedWeight);
      }
    }

    // Convert to format expected by Louvain algorithm
    const nodes = Array.from(louvainGraph.keys());
    const communities = new Map<string, number>();
    let currentCommunity = 0;

    // Initialize communities
    for (const node of nodes) {
      communities.set(node, currentCommunity++);
    }

    // Run Louvain algorithm
    let improved = true;
    while (improved) {
      improved = false;

      // For each node
      for (const node of nodes) {
        const currentCommunity = communities.get(node);
        if (currentCommunity === undefined) continue;

        let bestCommunity = currentCommunity;
        let bestModularity = calculateModularity(node, currentCommunity, communities, louvainGraph);

        // Try moving to each neighbor's community
        const neighbors = louvainGraph.get(node);
        if (!neighbors) continue;

        for (const [neighbor, weight] of neighbors) {
          const neighborCommunity = communities.get(neighbor);
          if (neighborCommunity === undefined || neighborCommunity === currentCommunity) continue;

          communities.set(node, neighborCommunity);
          const newModularity = calculateModularity(node, neighborCommunity, communities, louvainGraph);

          if (newModularity > bestModularity) {
            bestModularity = newModularity;
            bestCommunity = neighborCommunity;
            improved = true;
          }
        }

        communities.set(node, bestCommunity);
      }
    }

    // Group documents by community
    const clusters = new Map<number, DocumentCluster>();
    for (const [nodeId, communityId] of communities) {
      const doc = docsWithEmbeddings.find((d) => d.id === nodeId);
      if (!doc) continue;

      if (!clusters.has(communityId)) {
        clusters.set(communityId, {
          id: `cluster-${communityId}`,
          name: `Cluster ${communityId + 1}`,
          documents: [],
        });
      }

      const cluster = clusters.get(communityId);
      if (cluster) {
        cluster.documents.push({
          id: doc.id,
          name: doc.name,
        });
      }
    }

    return {
      success: true,
      clusters: Array.from(clusters.values()),
    };
  } catch (error) {
    console.error("Error clustering documents:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to calculate modularity
function calculateModularity(
  node: string,
  community: number,
  communities: Map<string, number>,
  graph: Map<string, Map<string, number>>,
): number {
  let modularity = 0;
  const nodeNeighbors = graph.get(node);
  if (!nodeNeighbors) return 0;

  const totalWeight = Array.from(nodeNeighbors.values()).reduce((sum, w) => sum + w, 0);

  for (const [neighbor, weight] of nodeNeighbors) {
    if (communities.get(neighbor) === community) {
      modularity += weight - (totalWeight * weight) / (2 * totalWeight);
    }
  }

  return modularity;
}
