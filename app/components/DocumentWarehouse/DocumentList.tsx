"use client";

import { updateDocumentFolder } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { DocumentShelf } from "./DocumentShelf";
import { UnsortedDocumentTray } from "./UnsortedDocumentTray";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const queryClient = useQueryClient();

  // Mutation for updating document folder
  const { mutate: updateFolder } = useMutation({
    mutationFn: async ({ documentId, folder }: { documentId: string; folder: string | undefined }) => {
      const result = await updateDocumentFolder(documentId, folder);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      toast.error(`Failed to update document folder: ${error.message}`);
    },
  });

  // Handle document deletion
  const handleDocumentDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

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

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable
    if (!destination) return;

    // No change in position
    if (source.droppableId === destination.droppableId) return;

    // Get the new folder from the destination droppable ID
    // Format: folder-{shelfNumber}-{folderName} or unsorted
    const newFolder = destination.droppableId === "unsorted" ? undefined : destination.droppableId.split("-")[2];

    // Update the document's folder
    updateFolder({ documentId: draggableId, folder: newFolder });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Unsorted Documents Tray */}
        <UnsortedDocumentTray documents={unsortedDocuments} onDocumentDeleted={handleDocumentDeleted} />

        {/* Regular shelves */}
        {sortedShelves.map(({ shelfNumber, documents }) => (
          <DocumentShelf
            key={shelfNumber}
            shelfNumber={shelfNumber}
            documents={documents}
            onDocumentDeleted={handleDocumentDeleted}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
