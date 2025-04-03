"use client";

import { getDocumentClusters } from "@/app/actions/document-clusters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface DocumentCluster {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
  }>;
}

export function DocumentClusters() {
  const [clusters, setClusters] = useState<DocumentCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClusters = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getDocumentClusters();
        if (!result.success || !result.clusters) {
          throw new Error(result.error);
        }

        setClusters(result.clusters);
      } catch (error) {
        console.error("Error loading clusters:", error);
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadClusters();
  }, []);

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Document Clusters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Analyzing document relationships...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Document Clusters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-sm text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Document Clusters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{cluster.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {cluster.documents.map((doc) => (
                    <li key={doc.id} className="text-sm">
                      {doc.name}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
