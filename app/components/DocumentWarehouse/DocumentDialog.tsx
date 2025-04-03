"use client";

import { calculateDocumentEmbedding, deleteDocument, updateDocument } from "@/app/actions/documents";
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
  const [shelf, setShelf] = useState<number | undefined>(document?.shelf);
  const [folder, setFolder] = useState<string | undefined>(document?.folder);
  const [section, setSection] = useState<string | undefined>(document?.section);
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

    // Validate folder format
    if (folder && !/^[A-Z]$/.test(folder)) {
      toast.error("Folder must be a single uppercase letter (A-Z)");
      return;
    }

    // Validate shelf number
    if (shelf && (Number.isNaN(shelf) || shelf < 1)) {
      toast.error("Shelf must be a positive number");
      return;
    }

    const documentId = document.id;
    startTransition(async () => {
      const result = await updateDocument(documentId, {
        shelf: shelf,
        folder: folder,
        section: section,
      });
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

            <TabsContent value="details" className="flex-1 overflow-y-auto">
              <div className="space-y-6 p-6">
                {/* Location section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Location</Label>
                    {isEditingLocation ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleLocationUpdate} disabled={isPending}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShelf(document.shelf);
                            setFolder(document.folder);
                            setSection(document.section);
                            setIsEditingLocation(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setShelf(document.shelf);
                          setFolder(document.folder);
                          setSection(document.section);
                          setIsEditingLocation(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingLocation ? (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shelf">Shelf</Label>
                          <Input
                            id="shelf"
                            type="number"
                            min="1"
                            value={shelf || ""}
                            onChange={(e) => setShelf(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                            placeholder="Shelf number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="folder">Folder</Label>
                          <Input
                            id="folder"
                            maxLength={1}
                            value={folder || ""}
                            onChange={(e) => setFolder(e.target.value.toUpperCase())}
                            placeholder="A-Z"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="section">Section</Label>
                          <Input
                            id="section"
                            value={section || ""}
                            onChange={(e) => setSection(e.target.value)}
                            placeholder="Optional section"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {shelf || folder || section ? (
                        <span>
                          {shelf && `Shelf ${shelf}`}
                          {folder && ` • Folder ${folder}`}
                          {section && ` • ${section}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No location set</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Rest of the details content */}
                {/* ... */}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              {/* Preview content */}
              {/* ... */}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
