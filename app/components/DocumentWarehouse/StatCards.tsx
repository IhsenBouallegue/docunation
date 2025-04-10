import { useDocuments } from "@/app/hooks/documents";
import { useFolders } from "@/app/hooks/folders";
import { GradientCard } from "@/components/ui/gradient-card";
import { IconNumberCard } from "@/components/ui/icon-number-card";
import { FileIcon, FolderIcon, TagIcon } from "lucide-react";

export function StatCards() {
  const { data: documents = [] } = useDocuments();
  const { data: folders = [] } = useFolders();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GradientCard
        gradient={{
          from: "rgb(59, 130, 246)", // blue-500
          via: "rgb(99, 102, 241)", // indigo-500
          to: "rgb(139, 92, 246)", // violet-500
        }}
        className="cursor-default transition-all duration-300 h-full"
      >
        <IconNumberCard
          title="Documents"
          description="Total documents in your library"
          icon={<FileIcon className="w-full h-full" />}
          number={documents.length}
        />
      </GradientCard>

      <GradientCard
        gradient={{
          from: "rgb(34, 197, 94)", // green-500
          via: "rgb(16, 185, 129)", // emerald-500
          to: "rgb(20, 184, 166)", // teal-500
        }}
        className="cursor-default transition-all duration-300 h-full"
      >
        <IconNumberCard
          title="Folders"
          description="Organized document folders"
          icon={<FolderIcon className="w-full h-full" />}
          number={folders.length}
        />
      </GradientCard>

      <GradientCard
        gradient={{
          from: "rgb(236, 72, 153)", // pink-500
          via: "rgb(225, 29, 72)", // rose-500
          to: "rgb(239, 68, 68)", // red-500
        }}
        className="cursor-default transition-all duration-300 h-full sm:col-span-2 lg:col-span-1"
      >
        <IconNumberCard
          title="Tags"
          description="Total tags across documents"
          icon={<TagIcon className="w-full h-full" />}
          number={documents.reduce((acc, doc) => acc + (doc.tags?.length || 0), 0)}
        />
      </GradientCard>
    </div>
  );
}
