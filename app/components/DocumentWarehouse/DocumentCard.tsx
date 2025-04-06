"use client";

import { deleteDocument } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentDialog } from "./DocumentDialog";

interface DocumentCardProps {
  document: Document;
  onDelete?: () => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the dialog
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      const result = await deleteDocument(document.id);

      if (result.success) {
        toast.success("Document deleted successfully");
        onDelete?.();
      } else {
        toast.error(`Failed to delete document: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Error deleting document: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className="group relative cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <FileText className="h-6 w-6 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{document.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{document.type}</p>
            </div>
          </div>

          {/* Delete button - appears on hover */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
          </Button>
        </CardContent>
      </Card>

      <DocumentDialog document={document} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}
