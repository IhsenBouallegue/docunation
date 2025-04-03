"use client";

import { getDocuments } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DocumentClusters } from "./DocumentClusters";
import { DocumentGraphCard } from "./DocumentGraphCard";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";

export function DocumentWarehouse() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const loadDocuments = async () => {
      const result = await getDocuments();
      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        toast.error("Failed to load documents");
      }
    };

    loadDocuments();
  }, []);

  const handleDocumentProcessed = (document: Document) => {
    setDocuments((prev) => [...prev, document]);
  };

  const handleUpload = (document: Document) => {
    handleDocumentProcessed(document);
  };

  return (
    <div className="space-y-4">
      <DocumentUpload onDocumentProcessed={handleUpload} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocumentList documents={documents} />
        <DocumentGraphCard />
      </div>
      <DocumentClusters />
    </div>
  );
}
