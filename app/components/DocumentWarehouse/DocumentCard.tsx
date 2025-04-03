"use client";

import type { Document } from "@/app/types/document";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useState } from "react";
import { DocumentDialog } from "./DocumentDialog";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsDialogOpen(true)}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <FileText className="h-6 w-6 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{document.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{document.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentDialog document={document} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}
