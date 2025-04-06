"use client";

import { getDocuments } from "@/app/actions/documents";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentClusters } from "./DocumentClusters";
import { DocumentGraphCard } from "./DocumentGraphCard";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";

export function DocumentWarehouse() {
  // Query for fetching documents
  const {
    data: documents,
    isPending,
    error,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const result = await getDocuments();
      if (!result.success) {
        throw new Error(result.error || "Failed to load documents");
      }
      return result.data || [];
    },
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 p-6">
      {/* Left Column - Documents */}
      <div className="w-1/2 flex flex-col gap-4 min-w-[500px]">
        <DocumentUpload />
        <div className="flex-1 overflow-hidden">
          {isPending ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
              <p className="text-sm font-medium">Failed to load documents</p>
              <p className="text-xs opacity-70">{error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          ) : (
            <DocumentList documents={documents || []} />
          )}
        </div>
      </div>
      {/* Right Column - Relationships and Clusters */}
      <div className="w-1/2 flex flex-col gap-4 min-w-[500px]">
        <DocumentGraphCard />
        <DocumentClusters />
      </div>
    </div>
  );
}
