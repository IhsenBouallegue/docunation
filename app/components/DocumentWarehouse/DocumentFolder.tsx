"use client";

import type { Document } from "@/app/types/document";
import { Droppable } from "@hello-pangea/dnd";
import { AnimatePresence, motion } from "framer-motion";
import { Folder } from "lucide-react";
import { useState } from "react";
import { CompactDocumentCard } from "./CompactDocumentCard";

interface DocumentFolderProps {
  title: string;
  documents: Document[];
  shelfNumber: number;
  folderName: string;
  onDocumentDeleted: () => void;
}

export function DocumentFolder({ title, documents, shelfNumber, folderName, onDocumentDeleted }: DocumentFolderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const droppableId = `folder-${shelfNumber}-${folderName}`;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Folder Label */}
      <div className="absolute -top-3 left-4 z-10 flex items-center gap-2 bg-white px-2">
        <Folder className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-5 w-5">
          {documents.length}
        </div>
      </div>

      {/* Folder Container */}
      <button
        type="button"
        className="w-full border border-dashed border-slate-300 rounded-lg bg-white cursor-pointer text-left relative"
        onClick={toggleExpanded}
      >
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 pb-6 overflow-hidden ${snapshot.isDraggingOver ? "bg-slate-50" : ""}`}
            >
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {documents.slice(0, isExpanded ? documents.length : 2).map((doc, index) => (
                    <CompactDocumentCard key={doc.id} document={doc} index={index} onDelete={onDocumentDeleted} />
                  ))}
                </AnimatePresence>
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* More Documents Label */}
        <AnimatePresence mode="wait">
          {!isExpanded && documents.length > 2 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{
                duration: isExpanded ? 0 : 0.3,
                delay: isExpanded ? 0 : 0.2,
                ease: "easeOut",
              }}
              className="absolute -bottom-3 left-4 z-10 flex items-center gap-2 bg-white px-2"
            >
              <span className="text-xs font-medium text-slate-500">+{documents.length - 2} more</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
