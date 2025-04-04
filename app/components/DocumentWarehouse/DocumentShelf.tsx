import type { Document } from "@/app/types/document";
import { motion } from "framer-motion";
import { BookOpen, Inbox } from "lucide-react";
import { useMemo } from "react";
import { DocumentFolder } from "./DocumentFolder";

interface DocumentShelfProps {
  documents: Document[];
  shelfNumber: number;
  isUnsorted?: boolean;
}

export function DocumentShelf({ documents, shelfNumber, isUnsorted }: DocumentShelfProps) {
  // Group documents by folder
  const documentsByFolder = useMemo(() => {
    // If unsorted, put all documents in the Unsorted folder
    if (isUnsorted) {
      return { Unsorted: documents };
    }

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
  }, [documents, isUnsorted]);

  // Sort folders alphabetically
  const sortedFolders = useMemo(() => {
    return Object.entries(documentsByFolder).sort(([a], [b]) => a.localeCompare(b));
  }, [documentsByFolder]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative border p-6 rounded-xl"
    >
      {/* Shelf Label */}
      <div className="flex items-center gap-2 mb-6">
        {isUnsorted ? <Inbox className="h-5 w-5 text-slate-600" /> : <BookOpen className="h-5 w-5 text-slate-600" />}
        <h2 className="text-lg font-medium text-slate-600">
          {isUnsorted ? "Unsorted Documents" : `Shelf ${shelfNumber}`}
        </h2>
        <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-5 px-2">
          {documents.length} documents
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedFolders.map(([folder, docs]) => (
          <DocumentFolder
            key={folder}
            title={
              isUnsorted ? "Unsorted Documents" : folder === "Unsorted" ? "Unsorted Documents" : `Folder ${folder}`
            }
            documents={docs}
          />
        ))}
      </div>
    </motion.div>
  );
}
