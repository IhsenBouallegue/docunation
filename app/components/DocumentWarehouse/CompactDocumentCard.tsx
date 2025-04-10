import { DocumentDialog } from "@/app/components/DocumentWarehouse/DocumentDialog";
import { useDeleteDocument } from "@/app/hooks/documents";
import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileArchive, FileImage, FileText, FileType, Trash2 } from "lucide-react";
import { useState } from "react";

const iconMap = {
  "application/pdf": <FileText className="h-4 w-4" />,
  image: <FileImage className="h-4 w-4" />,
  text: <FileType className="h-4 w-4" />,
  other: <FileArchive className="h-4 w-4" />,
} as const;

// List of 15 gradients for consistent document coloring
const gradients = [
  "from-rose-400 to-red-500",
  "from-orange-400 to-amber-500",
  "from-yellow-400 to-amber-500",
  "from-lime-400 to-green-500",
  "from-green-400 to-emerald-500",
  "from-emerald-400 to-teal-500",
  "from-teal-400 to-cyan-500",
  "from-cyan-400 to-blue-500",
  "from-blue-400 to-indigo-500",
  "from-indigo-400 to-violet-500",
  "from-violet-400 to-purple-500",
  "from-purple-400 to-fuchsia-500",
  "from-fuchsia-400 to-pink-500",
  "from-pink-400 to-rose-500",
  "from-slate-400 to-gray-500",
] as const;

// Get deterministic color based on document id
function getGradient(id: string): string {
  console.log("id", id);
  if (!id) return gradients[0];
  // Create a simple hash of the id
  const hash = id.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Use the hash to select a gradient
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

interface CompactDocumentCardProps {
  document: Document;
  index: number;
}

export function CompactDocumentCard({ document, index }: CompactDocumentCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Determine document type icon
  const type = document.type.startsWith("application/pdf")
    ? "application/pdf"
    : document.type.startsWith("image")
      ? "image"
      : document.type.startsWith("text")
        ? "text"
        : "other";

  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();

  return (
    <>
      <div>
        <motion.div
          layout
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "40px" }}
          exit={{ opacity: 0, height: 0 }}
          className={`
                group relative
                bg-gradient-to-r ${getGradient(document.documentContentHash)}
                px-3 rounded-md shadow-sm
                cursor-pointer hover:shadow-md transition-shadow
                flex items-center
                ${isDeleting ? "animate-pulse duration-1000" : ""}
              `}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDialogOpen(true);
          }}
        >
          <div className="flex items-center gap-2 text-white w-full">
            <div className="bg-white/20 p-1 rounded">{iconMap[type]}</div>
            <span className="text-sm font-medium truncate">{document.name}</span>
          </div>

          {/* Delete button - appears on hover */}
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity size-6"
            onClick={(e) => {
              e.stopPropagation();
              deleteDocument(document.id);
            }}
            disabled={isDeleting}
          >
            <Trash2 className="size-3" />
          </Button>
        </motion.div>
      </div>
      <DocumentDialog document={document} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}
