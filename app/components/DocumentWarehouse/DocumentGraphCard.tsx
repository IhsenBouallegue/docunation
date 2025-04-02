"use client";

import { getDocumentsWithEmbeddings } from "@/app/actions/get-documents-with-embeddings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

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

export function DocumentGraphCard() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeGraph = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get graph data from server
        const result = await getDocumentsWithEmbeddings();
        if (!result.success || !result.data) {
          throw new Error(result.error);
        }

        setGraphData(result.data);
      } catch (error) {
        console.error("Error initializing graph:", error);
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGraph();
  }, []);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Document Relationships</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading document relationships...</div>
          </div>
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-sm text-destructive">Error: {error}</div>
          </div>
        ) : (
          <div className="h-[400px] w-full flex items-center justify-center">
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              backgroundColor="#ffffff"
              width={600}
              height={400}
              nodeColor="color"
              linkColor="color"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
