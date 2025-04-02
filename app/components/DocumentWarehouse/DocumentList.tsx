"use client";

import type { Document } from "@/app/types/document";
import { DocumentCard } from "./DocumentCard";

interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
}

export function DocumentList({ documents, onDocumentSelect }: DocumentListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} onClick={onDocumentSelect} />
      ))}
    </div>
  );
}
