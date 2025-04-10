"use client";

import { useDeleteDocument, useUpdateDocument } from "@/app/hooks/documents";
import { useFolders } from "@/app/hooks/folders";
import { useShelves } from "@/app/hooks/shelves";
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
import { Download, Loader2, MapPin, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentDialog({ document, isOpen, onClose }: DocumentDialogProps) {
  const { data: folders } = useFolders();
  const { data: shelves } = useShelves();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [documentName, setDocumentName] = useState(document?.name || "");
  const [selectedTags, setSelectedTags] = useState<string[]>((document?.tags as string[]) || []);
  const [newTag, setNewTag] = useState("");

  const { mutate: updateDoc, isPending: isUpdating } = useUpdateDocument();
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();

  if (!document) return null;

  const handleTitleUpdate = () => {
    updateDoc(
      { documentId: document.id, data: { name: documentName } },
      {
        onSuccess: () => {
          toast.success("Document title updated successfully");
          setIsEditingTitle(false);
        },
        onError: (error) => {
          toast.error(`Failed to update title: ${error.message}`);
        },
      },
    );
  };

  const handleLocationUpdate = (folderId: string | null) => {
    updateDoc(
      { documentId: document.id, data: { folderId } },
      {
        onSuccess: () => {
          toast.success("Location updated successfully");
        },
        onError: (error) => {
          toast.error(`Failed to update location: ${error.message}`);
        },
      },
    );
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];

    setSelectedTags(newTags);
    updateDoc(
      { documentId: document.id, data: { tags: newTags } },
      {
        onError: (error) => {
          toast.error(`Failed to update tags: ${error.message}`);
          setSelectedTags(selectedTags); // Revert on failure
        },
      },
    );
  };

  const handleAddTag = () => {
    if (!newTag.trim() || selectedTags.includes(newTag.trim())) return;

    const newTags = [...selectedTags, newTag.trim()];
    updateDoc(
      { documentId: document.id, data: { tags: newTags } },
      {
        onSuccess: () => {
          setSelectedTags(newTags);
          setNewTag("");
        },
        onError: (error) => {
          toast.error(`Failed to add tag: ${error.message}`);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteDoc(document.id, {
      onSuccess: () => {
        toast.success("Document deleted successfully");
        onClose(); // Close the dialog after successful deletion
      },
      onError: (error) => {
        toast.error(`Failed to delete document: ${error.message}`);
      },
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
                  <Button size="sm" onClick={handleTitleUpdate} disabled={isUpdating}>
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
                {document.url && (
                  <div className="bg-white p-2 rounded-lg border">
                    <QRCodeSVG value={document.url} size={64} level="H" includeMargin={false} />
                  </div>
                )}
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
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Physical Location
                </h3>
                <div className="text-sm text-muted-foreground">
                  {document.folderId ? (
                    <>
                      Shelf: {shelves?.find((shelf) => shelf.id === document.folderId)?.name}
                      <br />
                      Folder: {folders?.find((folder) => folder.id === document.folderId)?.name}
                    </>
                  ) : (
                    "Unsorted"
                  )}
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
                    disabled={isUpdating}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddTag}
                    className="h-9 px-3"
                    disabled={isUpdating}
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
                          disabled={isUpdating}
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
              {document.url ? (
                <iframe
                  src={`${document.url.replace(/^https?:/, "")}#view=FitH`}
                  className="w-full h-full"
                  title={`Preview of ${document.name}`}
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No preview available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
