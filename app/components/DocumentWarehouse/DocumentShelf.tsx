import { CreateFolderCard } from "@/app/components/DocumentWarehouse/CreateFolderCard";
import { useDocuments } from "@/app/hooks/documents";
import { useFolders } from "@/app/hooks/folders";
import type { Shelf } from "@/app/types/document";
import { motion } from "framer-motion";
import { BookOpen, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { DocumentFolder } from "./DocumentFolder";

export function DocumentShelf({ shelf }: { shelf: Shelf }) {
  const { data: folders, isLoading: isLoadingFolders, error: foldersError } = useFolders();
  const filteredFolders = useMemo(() => {
    return folders?.filter((folder) => folder.shelfId === shelf.id) ?? [];
  }, [folders, shelf.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative border p-4 sm:p-6 rounded-xl bg-gradient-to-br bg-card"
    >
      {isLoadingFolders || foldersError ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Shelf Label */}
          <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
            <BookOpen className="h-5 w-5 text-slate-600" />
            <h2 className="text-base sm:text-lg font-medium text-slate-600">{shelf.name}</h2>
            <div className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium rounded-full h-5 px-2">
              {filteredFolders.length} Folders
            </div>
          </div>

          {/* Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredFolders.map((folder) => (
              <DocumentFolder key={folder.id} folder={folder} />
            ))}
            <CreateFolderCard shelfId={shelf.id} />
          </div>
        </>
      )}
    </motion.div>
  );
}
