"use client";

import { createDocumentGraph } from "@/app/actions/document-graph";
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
        const result = await createDocumentGraph();
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
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading document relationships...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center">
            <div className="text-sm text-destructive">Error: {error}</div>
          </div>
        ) : (
          <div className="w-full h-auto">
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              backgroundColor="transparent"
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
