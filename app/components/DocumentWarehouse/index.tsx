"use client";

import { getDocuments } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { GradientCard } from "@/components/ui/gradient-card";
import { IconNumberCard } from "@/components/ui/icon-number-card";
import { useQuery } from "@tanstack/react-query";
import { FileIcon, FileTextIcon, FolderIcon, Loader2, TagIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentClusters } from "./DocumentClusters";
import { DocumentGraphCard } from "./DocumentGraphCard";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";

const statsCards = [
  {
    id: "documents",
    title: "Documents",
    description: "Total documents in your library",
    icon: FileIcon,
    getValue: (docs: Document[]) => docs.length,
    gradient: {
      from: "rgb(59, 130, 246)", // blue-500
      via: "rgb(99, 102, 241)", // indigo-500
      to: "rgb(139, 92, 246)", // violet-500
    },
  },
  {
    id: "collections",
    title: "Collections",
    description: "Organized document collections",
    icon: FolderIcon,
    getValue: (docs: Document[]) => new Set(docs.map((doc) => doc.folder).filter(Boolean)).size,
    gradient: {
      from: "rgb(34, 197, 94)", // green-500
      via: "rgb(16, 185, 129)", // emerald-500
      to: "rgb(20, 184, 166)", // teal-500
    },
  },
  {
    id: "tags",
    title: "Tags",
    description: "Total tags across documents",
    icon: TagIcon,
    getValue: (docs: Document[]) => docs.reduce((acc, doc) => acc + (doc.tags?.length || 0), 0),
    gradient: {
      from: "rgb(236, 72, 153)", // pink-500
      via: "rgb(225, 29, 72)", // rose-500
      to: "rgb(239, 68, 68)", // red-500
    },
  },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-xl p-6 text-center">
      <FileTextIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-4">Upload your first document to get started with Docunation</p>
      <DocumentUpload />
    </div>
  );
}

export function DocumentWarehouse() {
  const {
    data: documents = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const result = await getDocuments();
      if (!result.success) {
        throw new Error(result.error || "Failed to load documents");
      }
      return result.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((card) => {
          const value = card.getValue(documents);
          return (
            <GradientCard
              key={card.id}
              gradient={card.gradient}
              isActive={value > 0}
              className="cursor-default transition-all duration-300"
            >
              <IconNumberCard
                title={card.title}
                description={card.description}
                icon={<card.icon className="w-full h-full" />}
                number={value}
                isActive={value > 0}
              />
            </GradientCard>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Documents */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <DocumentUpload />
          </div>
          <div className="flex-1 overflow-hidden rounded-xl">
            {isPending ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[400px] gap-2 text-destructive p-4 text-center">
                <p className="text-sm font-medium">Failed to load documents</p>
                <p className="text-xs opacity-70">{error instanceof Error ? error.message : "Unknown error"}</p>
              </div>
            ) : documents.length === 0 ? (
              <EmptyState />
            ) : (
              <DocumentList documents={documents} />
            )}
          </div>
        </div>

        {/* Right Column - Relationships and Clusters */}
        <div className="flex flex-col gap-4">
          <DocumentGraphCard />
          <DocumentClusters />
        </div>
      </div>
    </div>
  );
}
