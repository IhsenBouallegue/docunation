"use client";

import { processDocument } from "@/app/actions/documents";
import { uploadDocument } from "@/app/actions/upload";
import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface DocumentUploadProps {
  onDocumentProcessed: (document: Document) => void;
}

interface QueuedFile {
  file: File;
  id: string;
  status: "queued" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export function DocumentUpload() {
  const [isPending, startTransition] = useTransition();
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    // Add files to queue with unique IDs
    const newQueuedFiles = Array.from(files).map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: "queued" as const,
      progress: 0,
    }));
    setQueuedFiles((prev) => [...prev, ...newQueuedFiles]);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFromQueue = (id: string) => {
    setQueuedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const updateFileStatus = (id: string, updates: Partial<QueuedFile>) => {
    setQueuedFiles((prev) => prev.map((file) => (file.id === id ? { ...file, ...updates } : file)));
  };

  const uploadAll = async () => {
    const files = [...queuedFiles];
    let hasSuccessfulUpload = false;

    for (const queuedFile of files) {
      const { file, id } = queuedFile;

      try {
        // Update status to uploading
        updateFileStatus(id, { status: "uploading", progress: 0 });

        // Simulate upload progress (since FormData doesn't provide progress)
        const progressInterval = setInterval(() => {
          setQueuedFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file && file.status === "uploading" && file.progress < 90) {
              return prev.map((f) => (f.id === id ? { ...f, progress: f.progress + 10 } : f));
            }
            return prev;
          });
        }, 300);

        // Create FormData and append file
        const formData = new FormData();
        formData.append("file", file);

        // Upload file and get MinIO metadata
        const { bucketName, objectKey, name, type } = await uploadDocument(formData);

        clearInterval(progressInterval);
        updateFileStatus(id, { status: "processing", progress: 95 });

        // Process the document with MinIO metadata
        const result = await processDocument({
          name,
          bucketName,
          objectKey,
          type,
        });

        if (result.success && result.data) {
          updateFileStatus(id, { status: "completed", progress: 100 });
          toast.success(`Successfully processed ${name}`);
          hasSuccessfulUpload = true;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        updateFileStatus(id, {
          status: "error",
          progress: 0,
          error: errorMessage,
        });
        toast.error(`Upload failed: ${errorMessage}`);
      }
    }

    // If any upload was successful, invalidate queries
    if (hasSuccessfulUpload) {
      // Invalidate all document-related queries
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.refetchQueries({ queryKey: ["document-graph"] });
    }

    // Remove completed files after a delay
    setTimeout(() => {
      setQueuedFiles((prev) => prev.filter((file) => file.status === "error"));
    }, 2000);
  };

  const getFileCardStyle = (status: QueuedFile["status"]) => {
    switch (status) {
      case "completed":
        return "from-green-400 to-emerald-500";
      case "error":
        return "from-red-400 to-rose-500";
      case "uploading":
      case "processing":
        return "from-blue-400 to-indigo-500";
      default:
        return "from-gray-400 to-slate-500";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Documents
          </DialogTitle>
          <DialogDescription>Upload your documents to process and analyze them</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              multiple
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              <Upload className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF files up to 32MB</p>
            </label>
          </div>

          {queuedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Files to upload</h3>
                <Button onClick={uploadAll} disabled={isPending || queuedFiles.every((f) => f.status !== "queued")}>
                  Upload All
                </Button>
              </div>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {queuedFiles.map(({ file, id, status, progress, error }) => (
                  <div
                    key={id}
                    className={`group relative bg-gradient-to-r ${getFileCardStyle(status)} px-3 rounded-md shadow-sm h-10 flex items-center overflow-hidden`}
                  >
                    {(status === "uploading" || status === "processing") && (
                      <div
                        className="absolute inset-0 bg-white/20 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    <div className="flex items-center gap-2 text-white w-full relative">
                      <div className="bg-white/20 p-1 rounded">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                      {(status === "uploading" || status === "processing") && (
                        <span className="text-xs text-white/90">
                          {status === "processing" ? "Processing..." : `${Math.round(progress)}%`}
                        </span>
                      )}
                      {status === "error" && (
                        <span className="text-xs text-white/90 truncate max-w-[200px]" title={error}>
                          Error: {error}
                        </span>
                      )}
                    </div>
                    {status === "queued" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromQueue(id)}
                      >
                        <X className="h-4 w-4 text-white/80 hover:text-white" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
