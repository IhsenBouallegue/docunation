"use client";

import { getDocuments } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DocumentGraphCard } from "./DocumentGraphCard";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";

export function DocumentWarehouse() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      const result = await getDocuments();
      if (result.success && result.documents) {
        setDocuments(result.documents);
      } else {
        toast.error("Failed to load documents");
      }
    };

    loadDocuments();
  }, []);

  const handleDocumentProcessed = (document: Document) => {
    setDocuments((prev) => [...prev, document]);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Your Documents</h2>
          <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
        </div>
        <DocumentList documents={documents} onDocumentSelect={setSelectedDocument} />
      </div>

      <DocumentGraphCard />
    </div>
  );
}
