"use client";

import { useDocuments } from "@/app/hooks/documents";
import { useShelves } from "@/app/hooks/shelves";
import { Loader2 } from "lucide-react";
import { CreateShelfCard } from "./CreateShelfCard";
import { DocumentShelf } from "./DocumentShelf";
import { UnsortedDocumentTray } from "./UnsortedDocumentTray";

export function DocumentList() {
  const { data: shelves, isLoading: isLoadingShelves, error: shelvesError } = useShelves();
  const { isLoading: isLoadingDocuments, error: documentsError } = useDocuments();

  if (isLoadingShelves || isLoadingDocuments) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shelvesError || documentsError) {
    return (
      <div className="flex items-center justify-center h-32 text-destructive">
        Error loading shelves: {shelvesError?.message}
        {documentsError?.message}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <UnsortedDocumentTray />

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {shelves?.map((shelf) => (
          <DocumentShelf key={shelf.id} shelf={shelf} />
        ))}

        <CreateShelfCard />
      </div>
    </div>
  );
}
