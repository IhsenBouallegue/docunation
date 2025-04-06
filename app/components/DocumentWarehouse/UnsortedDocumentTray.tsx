import type { Document } from "@/app/types/document";
import { Droppable } from "@hello-pangea/dnd";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { CompactDocumentCard } from "./CompactDocumentCard";

interface UnsortedDocumentTrayProps {
  documents: Document[];
  onDocumentDeleted: () => void;
}

export function UnsortedDocumentTray({ documents, onDocumentDeleted }: UnsortedDocumentTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (documents.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-slate-50/50 rounded-xl p-6 border"
    >
      {/* Tray Label */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity"
      >
        <Inbox className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-medium text-slate-600">Unsorted Documents</h2>
        <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-5 px-2">
          {documents.length} documents
        </div>
      </button>

      {/* Documents */}
      <Droppable droppableId="unsorted">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${snapshot.isDraggingOver ? "bg-slate-100/50 rounded-lg p-2" : ""}`}
          >
            <AnimatePresence initial={false}>
              {documents.slice(0, isExpanded ? documents.length : 2).map((doc, index) => (
                <CompactDocumentCard key={doc.id} document={doc} index={index} onDelete={onDocumentDeleted} />
              ))}
            </AnimatePresence>
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
            className="mt-2 text-center"
          >
            <span className="text-xs font-medium text-slate-500">+{documents.length - 2} more</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
