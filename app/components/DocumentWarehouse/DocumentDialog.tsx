"use client";

import { calculateDocumentEmbedding } from "@/app/actions/calculate-document-embedding";
import { deleteDocument } from "@/app/actions/delete-document";
import { updateDocument } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Download, Loader2, MapPin, Network, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface DocumentDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentDialog({ document, isOpen, onClose }: DocumentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [documentName, setDocumentName] = useState(document?.name || "");
  const [location, setLocation] = useState(
    document?.location || {
      storageUnit: "",
      folderBox: "",
    },
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(document?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isCalculatingEmbedding, startCalculatingEmbedding] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  if (!document) return null;

  const handleTitleUpdate = () => {
    if (!document?.id) {
      toast.error("Cannot update document: Missing document ID");
      return;
    }
    const documentId = document.id;
    startTransition(async () => {
      const result = await updateDocument(documentId, { name: documentName });
      if (result.success) {
        toast.success("Document title updated successfully");
        setIsEditingTitle(false);
      } else {
        toast.error(`Failed to update title: ${result.error}`);
      }
    });
  };

  const handleLocationUpdate = () => {
    if (!document?.id) {
      toast.error("Cannot update document: Missing document ID");
      return;
    }
    const documentId = document.id;
    startTransition(async () => {
      const result = await updateDocument(documentId, { location });
      if (result.success) {
        toast.success("Location updated successfully");
        setIsEditingLocation(false);
      } else {
        toast.error(`Failed to update location: ${result.error}`);
      }
    });
  };

  const handleTagToggle = (tag: string) => {
    if (!document?.id) {
      toast.error("Cannot update document: Missing document ID");
      return;
    }
    const documentId = document.id;
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];

    setSelectedTags(newTags);
    startTransition(async () => {
      const result = await updateDocument(documentId, { tags: newTags });
      if (!result.success) {
        toast.error(`Failed to update tags: ${result.error}`);
        setSelectedTags(selectedTags); // Revert on failure
      }
    });
  };

  const handleAddTag = () => {
    if (!document?.id) {
      toast.error("Cannot update document: Missing document ID");
      return;
    }
    if (!newTag.trim() || selectedTags.includes(newTag.trim())) return;

    const documentId = document.id;
    const newTags = [...selectedTags, newTag.trim()];
    startTransition(async () => {
      const result = await updateDocument(documentId, { tags: newTags });
      if (result.success) {
        setSelectedTags(newTags);
        setNewTag("");
      } else {
        toast.error(`Failed to add tag: ${result.error}`);
      }
    });
  };

  const handleCalculateEmbedding = () => {
    if (!document?.id) {
      toast.error("Cannot update document: Missing document ID");
      return;
    }
    const documentId = document.id;
    startCalculatingEmbedding(async () => {
      const result = await calculateDocumentEmbedding(documentId);
      if (result.success) {
        toast.success(`Document embedding calculated successfully from ${result.chunkCount} chunks`);
      } else {
        toast.error(`Failed to calculate embedding: ${result.error}`);
      }
    });
  };

  const handleDelete = () => {
    if (!document?.id) {
      toast.error("Cannot delete document: Missing document ID");
      return;
    }
    const documentId = document.id;
    startDeleting(async () => {
      const result = await deleteDocument(documentId);
      if (result.success) {
        toast.success("Document deleted successfully");
        onClose(); // Close the dialog after successful deletion
      } else {
        toast.error(`Failed to delete document: ${result.error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="space-y-1.5">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className="text-xl font-semibold h-9"
                    onKeyDown={(e) => e.key === "Enter" && handleTitleUpdate()}
                  />
                  <Button size="sm" onClick={handleTitleUpdate} disabled={isPending}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{document.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setDocumentName(document.name);
                      setIsEditingTitle(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{document.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg border">
                  <QRCodeSVG value={document.url} size={64} level="H" includeMargin={false} />
                </div>
                <span className="text-xs text-muted-foreground mt-1">Scan to access</span>
              </div>
              <Button variant="outline" size="icon" asChild className="h-10 w-10">
                <a href={document.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-10 w-10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this document? This action cannot be undone. This will delete the
                      document from the database and remove its vector embeddings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Physical Location Section */}
              <div className="space-y-3 border-b pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Physical Location
                  </h3>
                  {!isEditingLocation ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingLocation(true)} disabled={isPending}>
                      Edit Location
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleLocationUpdate} disabled={isPending}>
                      Save Location
                    </Button>
                  )}
                </div>

                {isEditingLocation ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="storageUnit">Storage Unit</Label>
                      <Input
                        id="storageUnit"
                        value={location.storageUnit}
                        onChange={(e) => setLocation((prev) => ({ ...prev, storageUnit: e.target.value }))}
                        placeholder="e.g., Cabinet 1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="folderBox">Folder/Box</Label>
                      <Input
                        id="folderBox"
                        value={location.folderBox}
                        onChange={(e) => setLocation((prev) => ({ ...prev, folderBox: e.target.value }))}
                        placeholder="e.g., Folder 42"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    {location.storageUnit && location.folderBox ? (
                      <p>
                        <span className="font-medium">Storage:</span> {location.storageUnit} •{" "}
                        <span className="font-medium">Container:</span> {location.folderBox}
                      </p>
                    ) : (
                      <p>No physical location specified</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-b pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Document Embedding
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCalculateEmbedding}
                    disabled={isCalculatingEmbedding}
                  >
                    {isCalculatingEmbedding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Calculate Embedding
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                  <p>Generate a semantic embedding for this document based on its content.</p>
                  <p className="mt-1 text-xs">This will help with document similarity and grouping.</p>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>

                <div className="flex items-center gap-2 mb-3">
                  <Input
                    placeholder="Add new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="h-9"
                    disabled={isPending}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddTag}
                    className="h-9 px-3"
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-3 py-1.5 text-xs flex items-center gap-1 group"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="opacity-60 hover:opacity-100 focus:opacity-100"
                          disabled={isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags added</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 border-t mt-0 data-[state=active]:flex">
              <iframe
                src={`${document.url}#view=FitH`}
                className="w-full h-full"
                title={`Preview of ${document.name}`}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
