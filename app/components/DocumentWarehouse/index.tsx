"use client";

import { getDocuments } from "@/app/actions/documents";
import { DocumentShelf } from "@/app/components/DocumentWarehouse/DocumentShelf";
import type { Document } from "@/app/types/document";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentClusters } from "./DocumentClusters";
import { DocumentGraphCard } from "./DocumentGraphCard";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";

export function DocumentWarehouse() {
  const [documents, setDocuments] = useState<Document[]>([]);

  // Query for fetching documents
  const { data: fetchedDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const result = await getDocuments();
      if (!result.success) {
        toast.error("Failed to load documents");
        return [];
      }
      return result.data || [];
    },
  });

  // Combine fetched documents with locally added ones
  const allDocuments = [...(fetchedDocuments || []), ...documents];

  const handleDocumentProcessed = (document: Document) => {
    setDocuments((prev) => [...prev, document]);
  };

  const handleUpload = (document: Document) => {
    handleDocumentProcessed(document);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 p-6">
      {/* Left Column - Documents */}
      <div className="w-1/2 flex flex-col gap-4 min-w-[500px]">
        <DocumentUpload onDocumentProcessed={handleUpload} />
        <div className="flex-1 overflow-hidden">
          <DocumentList documents={allDocuments} />
        </div>
      </div>
      {/* Right Column - Relationships and Clusters */}
      <div className="w-1/2 flex flex-col gap-4 min-w-[500px]">
        <div className="flex-1 overflow-hidden">
          <DocumentGraphCard />
        </div>
        <div className="flex-1 overflow-hidden">
          <DocumentClusters />
        </div>
      </div>
    </div>
  );
}
