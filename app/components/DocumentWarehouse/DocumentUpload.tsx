"use client";

import { processDocument } from "@/app/actions/process-document";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
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
import { UploadDropzone } from "@uploadthing/react";
import { FileText, Upload } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ClientUploadedFileData } from "uploadthing/types";

interface DocumentUploadProps {
  onDocumentProcessed: (document: Document) => void;
}

export function DocumentUpload({ onDocumentProcessed }: DocumentUploadProps) {
  const [isPending, startTransition] = useTransition();

  const handleUploadComplete = (uploadedFiles: ClientUploadedFileData<null>[]) => {
    for (const file of uploadedFiles) {
      startTransition(async () => {
        const result = await processDocument({
          name: file.name,
          url: file.ufsUrl,
          type: file.type,
        });

        if (result.success && result.document) {
          toast.success(`Successfully processed ${file.name}`);
          onDocumentProcessed(result.document);
        } else {
          toast.error(`Failed to process ${file.name}: ${result.error}`);
        }
      });
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
        <UploadDropzone<OurFileRouter, "documentUploader">
          endpoint="documentUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(error) => {
            toast.error(`Upload failed: ${error.message}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
