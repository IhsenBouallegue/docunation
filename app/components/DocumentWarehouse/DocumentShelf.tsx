import { CompactDocumentCard } from "@/app/components/DocumentWarehouse/CompactDocumentCard";
import type { Document } from "@/app/types/document";
import { motion } from "framer-motion";
import { BookOpen, Inbox } from "lucide-react";
import { useMemo } from "react";
import { DocumentFolder } from "./DocumentFolder";

interface DocumentShelfProps {
  documents: Document[];
  shelfNumber: number;
  onDocumentDeleted: () => void;
}

export function DocumentShelf({ documents, shelfNumber, onDocumentDeleted }: DocumentShelfProps) {
  // Group documents by folder
  const documentsByFolder = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        const folder = doc.folder || "Unsorted";
        if (!acc[folder]) {
          acc[folder] = [];
        }
        acc[folder].push(doc);
        return acc;
      },
      {} as Record<string, Document[]>,
    );
  }, [documents]);

  // Sort folders alphabetically
  const sortedFolders = useMemo(() => {
    return Object.entries(documentsByFolder).sort(([a], [b]) => a.localeCompare(b));
  }, [documentsByFolder]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative border p-6 rounded-xl bg-gradient-to-br bg-card"
    >
      {/* Shelf Label */}
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-medium text-slate-600">Shelf {shelfNumber}</h2>
        <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-5 px-2">
          {documents.length} documents
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedFolders.map(([folder, docs]) => (
          <DocumentFolder
            key={folder}
            title={folder === "Unsorted" ? "Unsorted Documents" : `Folder ${folder}`}
            documents={docs}
            shelfNumber={shelfNumber}
            folderName={folder}
            onDocumentDeleted={onDocumentDeleted}
          />
        ))}
      </div>
    </motion.div>
  );
}
