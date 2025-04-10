"use client";

import { useDocuments } from "@/app/hooks/documents";
import { useDeleteFolder } from "@/app/hooks/folders";
import type { Folder } from "@/app/types/document";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FolderIcon, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CompactDocumentCard } from "./CompactDocumentCard";

const NUM_DOCUMENTS_TO_SHOW = 3;

export function DocumentFolder({ folder }: { folder: Folder }) {
  const { data: documents } = useDocuments();
  const { mutate: deleteFolder, isPending: isDeleting } = useDeleteFolder(folder.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredDocuments = useMemo(() => {
    return documents?.filter((doc) => doc.folderId === folder.id) ?? [];
  }, [documents, folder.id]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const handleDelete = () => {
    deleteFolder();
    setShowDeleteDialog(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="relative w-full max-w-full sm:max-w-md mx-auto h-full">
          {/* Folder Label */}
          <div
            className="absolute -top-3 left-3 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 bg-white px-1.5 sm:px-2 cursor-pointer"
            onClick={toggleExpanded}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                toggleExpanded();
              }
            }}
          >
            {filteredDocuments.length > NUM_DOCUMENTS_TO_SHOW && (
              <ChevronRight
                className={`h-3.5 sm:h-4 w-3.5 sm:w-4 text-slate-600 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
              />
            )}
            <FolderIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-slate-600" />
            <span className="text-xs sm:text-sm font-medium text-slate-600 truncate max-w-[150px] sm:max-w-[200px]">
              {folder.name}
            </span>
            <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-4 sm:h-5 w-4 sm:w-5 min-w-[16px] sm:min-w-[20px]">
              {filteredDocuments.length}
            </div>
          </div>

          {/* Folder Container */}
          <div
            className="w-full h-full min-h-[120px] sm:min-h-32 border border-dashed border-slate-400 rounded-lg bg-white cursor-pointer text-left relative p-2 sm:p-3"
            onClick={toggleExpanded}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                toggleExpanded();
              }
            }}
          >
            <div className="space-y-1.5 sm:space-y-2">
              <AnimatePresence initial={false}>
                {filteredDocuments
                  .slice(0, isExpanded ? filteredDocuments.length : NUM_DOCUMENTS_TO_SHOW)
                  .map((doc, index) => (
                    <CompactDocumentCard key={doc.id} document={doc} index={index} />
                  ))}
              </AnimatePresence>
            </div>
            {filteredDocuments.length === 0 && (
              <div className="text-xs sm:text-sm text-slate-500 text-center mt-4">Empty folder</div>
            )}
          </div>

          {/* More Documents Label */}
          <AnimatePresence mode="wait">
            {!isExpanded && filteredDocuments.length > NUM_DOCUMENTS_TO_SHOW && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{
                  duration: isExpanded ? 0 : 0.3,
                  delay: isExpanded ? 0 : 0.2,
                  ease: "easeOut",
                }}
                className="absolute -bottom-2 left-3 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 bg-white px-1.5 sm:px-2"
              >
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">
                  +{filteredDocuments.length - NUM_DOCUMENTS_TO_SHOW} more
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <ContextMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Folder
            </ContextMenuItem>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this folder? This will unassign all documents in this folder but won't
                delete the documents themselves.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContextMenuContent>
    </ContextMenu>
  );
}
