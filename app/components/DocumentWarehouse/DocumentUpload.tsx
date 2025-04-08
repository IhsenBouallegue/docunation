"use client";

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
import { FileText, Trash2, Upload, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface QueuedFile {
  file: File;
  id: string;
  status:
    | "queued"
    | "extracting"
    | "uploading"
    | "analyzing"
    | "chunking"
    | "embedding"
    | "storing"
    | "completed"
    | "error";
  progress: number;
  error?: string;
  generatedTitle?: string;
}

// Helper function to process chunks of files in parallel
async function processFilesInChunks(
  files: QueuedFile[],
  chunkSize: number,
  processFile: (file: QueuedFile) => Promise<void>,
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map((file) => processFile(file)));
  }
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
      id: uuidv4(),
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

  const clearCompleted = () => {
    setQueuedFiles((prev) => prev.filter((file) => file.status !== "completed"));
  };

  const updateFileStatus = (id: string, updates: Partial<QueuedFile>) => {
    setQueuedFiles((prev) => prev.map((file) => (file.id === id ? { ...file, ...updates } : file)));
  };

  const getStatusMessage = (status: QueuedFile["status"]) => {
    switch (status) {
      case "extracting":
        return "Extracting content...";
      case "uploading":
        return "Uploading...";
      case "analyzing":
        return "Analyzing document...";
      case "chunking":
        return "Processing chunks...";
      case "embedding":
        return "Generating embeddings...";
      case "storing":
        return "Storing document...";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Queued";
    }
  };

  const processFile = async (queuedFile: QueuedFile) => {
    const { file, id } = queuedFile;

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append("file", file);

      // Start streaming process
      const response = await fetch("/api/documents/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to start document processing");
      }

      const decoder = new TextDecoder();
      let success = false;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Process all complete JSON messages in this chunk
          const chunk = decoder.decode(value, { stream: true });
          const messages = chunk.split("\n").filter(Boolean);

          for (const message of messages) {
            const update = JSON.parse(message);

            if (update.error) {
              throw new Error(update.error);
            }

            if (update.step === 1) {
              updateFileStatus(id, { status: "extracting", progress: 20 });
            } else if (update.step === 2) {
              updateFileStatus(id, { status: "uploading", progress: 40 });
            } else if (update.step === 3) {
              updateFileStatus(id, { status: "chunking", progress: 60 });
            } else if (update.step === 4) {
              updateFileStatus(id, { status: "embedding", progress: 80 });
            } else if (update.step === 5) {
              if (update.document) {
                updateFileStatus(id, {
                  status: "completed",
                  progress: 100,
                  generatedTitle: update.document.name,
                });
                toast.success(`Successfully processed ${update.document.name}`);
                success = true;
              } else {
                updateFileStatus(id, { status: "storing", progress: 90 });
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      updateFileStatus(id, {
        status: "error",
        progress: 0,
        error: errorMessage,
      });
      toast.error(`Upload failed: ${errorMessage}`);
      return false;
    }
  };

  const uploadAll = async () => {
    const files = [...queuedFiles];
    let hasSuccessfulUpload = false;

    try {
      // Process files in chunks of 5
      await processFilesInChunks(files, 5, async (file) => {
        const success = await processFile(file);
        if (success) {
          hasSuccessfulUpload = true;
        }
      });

      // If any upload was successful, invalidate queries
      if (hasSuccessfulUpload) {
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
        await queryClient.invalidateQueries({ queryKey: ["document-graph"] });
        await queryClient.invalidateQueries({ queryKey: ["document-suggestions"] });
      }
    } catch (error) {
      console.error("Error during parallel upload:", error);
      toast.error("Some files failed to upload. Please check the error messages.");
    }
  };

  const getFileCardStyle = (status: QueuedFile["status"]) => {
    switch (status) {
      case "completed":
        return "from-green-400 to-emerald-500";
      case "error":
        return "from-red-400 to-rose-500";
      case "extracting":
      case "uploading":
      case "analyzing":
      case "chunking":
      case "embedding":
      case "storing":
        return "from-blue-400 to-indigo-500";
      default:
        return "from-gray-400 to-slate-500";
    }
  };

  const hasCompletedFiles = queuedFiles.some((file) => file.status === "completed");

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
                <div className="flex items-center gap-2">
                  {hasCompletedFiles && (
                    <Button variant="outline" size="sm" onClick={clearCompleted}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Completed
                    </Button>
                  )}
                  <Button onClick={uploadAll} disabled={isPending || queuedFiles.every((f) => f.status !== "queued")}>
                    Upload All
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {queuedFiles.map(({ file, id, status, progress, error, generatedTitle }) => (
                  <div
                    key={id}
                    className={`group relative bg-gradient-to-r ${getFileCardStyle(status)} px-3 rounded-md shadow-sm min-h-[40px] flex items-center overflow-hidden`}
                  >
                    {status !== "completed" && status !== "error" && (
                      <div
                        className="absolute inset-0 bg-white/20 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    <div className="flex w-full items-center gap-2 text-white py-2">
                      <div className="bg-white/20 p-1 rounded shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 w-[300px]">
                        {status === "completed" && generatedTitle ? (
                          <div className="space-y-0.5">
                            <p className="text-xs line-through text-white/70 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-sm font-medium truncate" title={generatedTitle}>
                              {generatedTitle}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm font-medium truncate block" title={file.name}>
                            {file.name}
                          </span>
                        )}
                      </div>
                      {status !== "queued" && (
                        <span className="text-xs text-white/90 text-right ">
                          {status === "error" ? (
                            <span className="text-xs text-white/90 truncate block" title={error}>
                              Error: {error}
                            </span>
                          ) : (
                            getStatusMessage(status)
                          )}
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
