"use client";

import { useDocuments } from "@/app/hooks/documents";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { CompactDocumentCard } from "./CompactDocumentCard";

export function UnsortedDocumentTray() {
  const { data: documents = [] } = useDocuments();
  const unsortedDocuments = documents.filter((doc) => doc.folderId === null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (unsortedDocuments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-slate-50/50 rounded-xl p-4 sm:p-6 border"
    >
      {/* Tray Label */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 hover:opacity-70 transition-opacity"
      >
        <Inbox className="h-4 sm:h-5 w-4 sm:w-5 text-slate-600" />
        <h2 className="text-base sm:text-lg font-medium text-slate-600">Unsorted Documents</h2>
        <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-4 sm:h-5 px-1.5 sm:px-2 min-w-[16px] sm:min-w-[20px]">
          {unsortedDocuments.length} documents
        </div>
      </button>

      {/* Documents */}
      <div className="space-y-1.5 sm:space-y-2">
        <AnimatePresence initial={false}>
          {unsortedDocuments.slice(0, isExpanded ? unsortedDocuments.length : 2).map((doc, index) => (
            <CompactDocumentCard key={doc.id} document={doc} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* More Documents Label */}
      <AnimatePresence mode="wait">
        {!isExpanded && unsortedDocuments.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{
              duration: isExpanded ? 0 : 0.3,
              delay: isExpanded ? 0 : 0.2,
              ease: "easeOut",
            }}
            className="mt-1.5 sm:mt-2 text-center"
          >
            <span className="text-[10px] sm:text-xs font-medium text-slate-500">
              +{unsortedDocuments.length - 2} more
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
