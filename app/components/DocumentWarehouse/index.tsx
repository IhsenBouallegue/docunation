"use client";

import { DocumentClusters } from "@/app/components/DocumentWarehouse/DocumentClusters";
import { DocumentGraphCard } from "@/app/components/DocumentWarehouse/DocumentGraphCard";
import { StatCards } from "@/app/components/DocumentWarehouse/StatCards";
import { useDocuments } from "@/app/hooks/documents";
import { FileTextIcon, Loader2 } from "lucide-react";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-xl p-6 text-center">
      <FileTextIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-4">Upload your first document to get started with Docunation</p>
      <DocumentUpload />
    </div>
  );
}

export function DocumentWarehouse() {
  const { data: documents = [], isPending: isDocumentsPending, error: documentsError } = useDocuments();

  return (
    <div className="space-y-4 sm:space-y-6">
      <StatCards />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column - Documents */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Documents</h2>
            <DocumentUpload />
          </div>
          <div className="flex-1 overflow-hidden rounded-xl">
            {isDocumentsPending ? (
              <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documentsError ? (
              <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] gap-2 text-destructive p-4 text-center">
                <p className="text-sm font-medium">Failed to load documents</p>
                <p className="text-xs opacity-70">
                  {documentsError instanceof Error ? documentsError.message : "Unknown error"}
                </p>
              </div>
            ) : documents.length === 0 ? (
              <EmptyState />
            ) : (
              <DocumentList />
            )}
          </div>
        </div>

        {/* Right Column - Relationships and Clusters */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <DocumentClusters />
          <DocumentGraphCard />
        </div>
      </div>
    </div>
  );
}
