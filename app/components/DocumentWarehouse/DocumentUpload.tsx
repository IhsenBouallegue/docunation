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
import { FileText, Upload } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

interface DocumentUploadProps {
  onDocumentProcessed: (document: Document) => void;
}

export function DocumentUpload({ onDocumentProcessed }: DocumentUploadProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      startTransition(async () => {
        try {
          // Create FormData and append file
          const formData = new FormData();
          formData.append("file", file);

          // Upload file and get MinIO metadata
          const { bucketName, objectKey, name, type } = await uploadDocument(formData);

          // Process the document with MinIO metadata
          const result = await processDocument({
            name,
            bucketName,
            objectKey,
            type,
          });

          if (result.success && result.data) {
            toast.success(`Successfully processed ${name}`);
            onDocumentProcessed(result.data);
          } else {
            toast.error(`Failed to process ${name}: ${result.error}`);
          }
        } catch (error) {
          toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      });
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      </DialogContent>
    </Dialog>
  );
}
