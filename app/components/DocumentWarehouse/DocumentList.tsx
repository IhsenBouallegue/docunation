"use client";

import type { Document } from "@/app/types/document";
import { useMemo } from "react";
import { DocumentShelf } from "./DocumentShelf";
import { UnsortedDocumentTray } from "./UnsortedDocumentTray";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  // Separate documents into sorted and unsorted
  const { sortedDocuments, unsortedDocuments } = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        if (!doc.shelf && !doc.folder) {
          acc.unsortedDocuments.push(doc);
        } else {
          acc.sortedDocuments.push(doc);
        }
        return acc;
      },
      { sortedDocuments: [] as Document[], unsortedDocuments: [] as Document[] },
    );
  }, [documents]);

  // Group sorted documents by shelf
  const documentsByShelf = useMemo(() => {
    return sortedDocuments.reduce(
      (acc, doc) => {
        // Only process documents with a shelf number
        if (doc.shelf) {
          if (!acc[doc.shelf]) {
            acc[doc.shelf] = [];
          }
          acc[doc.shelf].push(doc);
        }
        return acc;
      },
      {} as Record<number, Document[]>,
    );
  }, [sortedDocuments]);

  // Sort shelves numerically
  const sortedShelves = useMemo(() => {
    return Object.entries(documentsByShelf)
      .map(([shelf, docs]) => ({
        shelfNumber: Number.parseInt(shelf),
        documents: docs,
      }))
      .sort((a, b) => a.shelfNumber - b.shelfNumber);
  }, [documentsByShelf]);

  return (
    <div className="space-y-4">
      {/* Unsorted Documents Tray */}
      <UnsortedDocumentTray documents={unsortedDocuments} />

      {/* Regular shelves */}
      {sortedShelves.map(({ shelfNumber, documents }) => (
        <DocumentShelf key={shelfNumber} shelfNumber={shelfNumber} documents={documents} />
      ))}
    </div>
  );
}
