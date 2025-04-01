"use client";

import { analyzeDocument } from "@/app/actions/analyze-document";
import { UploadDropzone } from "@/app/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface UploadResponse {
  name: string;
  url: string;
  size: number;
  type: string;
}

export default function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadComplete = (res: UploadResponse[]) => {
    if (res) {
      const newFiles = res.map((file) => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      toast.success("Files uploaded successfully");
    }
  };

  const handleUploadError = (error: Error) => {
    toast.error("Error uploading files", {
      description: error.message,
    });
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      for (const file of files) {
        const result = await analyzeDocument(file.url, file.name);
        if (!result.success) {
          throw new Error(result.error || "Failed to analyze document");
        }
      }
      toast.success("Documents analyzed successfully");
    } catch (error) {
      toast.error("Error processing documents", {
        description: "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Upload
        </CardTitle>
        <CardDescription>Upload your documents for AI-powered analysis and processing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UploadDropzone
          endpoint="documentUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          className="border-2 border-dashed"
        />

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Uploaded Files ({files.length})</h3>
              <Button onClick={handleProcessFiles} disabled={isProcessing} className="flex items-center gap-2">
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Process Documents
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
