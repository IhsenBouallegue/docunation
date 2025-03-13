"use client";

import { parseDocuments } from "@/app/actions/parse-documents";
import { UploadDropzone } from "@/app/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image as ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface UploadResponse {
  name: string;
  url: string;
  type?: string;
}

export default function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const handleProcessFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    try {
      const formData = new FormData();
      for (const file of files) {
        // Fetch the file from the URL and append it to formData
        const response = await fetch(file.url);
        const blob = await response.blob();
        formData.append("files", blob, file.name);
      }

      const result = await parseDocuments(formData);

      if (result.success) {
        toast.success("Documents processed successfully", {
          description: result.message,
        });
        setFiles([]);
        setProcessedCount(result.results?.length ?? 0);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to process documents", {
        description: "Please try again",
      });
      console.error("Error processing files:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const onUploadComplete = (res: UploadResponse[]) => {
    if (res) {
      const newFiles = res.map((file) => ({
        name: file.name,
        url: file.url,
        type: file.type || "application/octet-stream",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      toast.success("Files uploaded successfully");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>Upload your documents to process them with AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadDropzone
          endpoint="documentUploader"
          onClientUploadComplete={onUploadComplete}
          onUploadError={(error: Error) => {
            toast.error("Upload failed", {
              description: error.message,
            });
          }}
        />

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Uploaded Files:</h3>
              <div className="grid grid-cols-2 gap-4">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative group rounded-lg border p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-start gap-3">
                      {file.type.includes("image") ? (
                        <img src={file.url} alt={file.name} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-secondary/50 flex items-center justify-center">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.type.split("/")[1].toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleProcessFiles} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Process Files"}
            </Button>
          </div>
        )}

        {processedCount > 0 && !files.length && (
          <div className="mt-4 p-4 bg-secondary/20 rounded">
            <p className="text-sm text-center text-muted-foreground">
              Successfully processed {processedCount} document{processedCount !== 1 ? "s" : ""}. The documents are now
              ready for querying.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
