"use client";

import { createDocumentGraph } from "@/app/actions/document-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
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

export function DocumentGraphCard() {
  const {
    data: graphData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["document-graph"],
    queryFn: async () => {
      const result = await createDocumentGraph();
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Document Relationships</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-destructive">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : graphData?.nodes.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No document relationships found. Add more documents to see connections.
          </div>
        ) : (
          <div className="w-full h-[50vh] min-h-[300px] overflow-hidden">
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              backgroundColor="transparent"
              width={undefined}
              height={undefined}
              nodeColor="color"
              linkColor="color"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
