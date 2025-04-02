"use client";

import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, MapPin, QrCode, Tag } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentDialog({ document, isOpen, onClose }: DocumentDialogProps) {
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [location, setLocation] = useState(
    document?.location || {
      storageUnit: "",
      folderBox: "",
    },
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(document?.tags || []);

  if (!document) return null;

  const handleLocationUpdate = () => {
    // In a real app, this would save to a database
    toast.success("Location updated successfully");
    setIsEditingLocation(false);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{document.name}</h2>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{document.type}</p>

                {/* Physical Location Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Physical Location
                    </h3>
                    {!isEditingLocation ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingLocation(true)}>
                        Edit Location
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleLocationUpdate}>
                        Save Location
                      </Button>
                    )}
                  </div>
                  {isEditingLocation ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="storageUnit">Storage Unit</Label>
                        <Input
                          id="storageUnit"
                          value={location.storageUnit}
                          onChange={(e) => setLocation((prev) => ({ ...prev, storageUnit: e.target.value }))}
                          placeholder="e.g., Cabinet 1"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="folderBox">Folder/Box</Label>
                        <Input
                          id="folderBox"
                          value={location.folderBox}
                          onChange={(e) => setLocation((prev) => ({ ...prev, folderBox: e.target.value }))}
                          placeholder="e.g., Folder 42"
                          className="h-8"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {location.storageUnit && location.folderBox ? (
                        <p>
                          {location.storageUnit} • {location.folderBox}
                        </p>
                      ) : (
                        <p>No location specified</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Button
                        key={tag}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTagToggle(tag)}
                        className="h-7 text-xs"
                      >
                        {tag}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tag = prompt("Enter new tag");
                        if (tag) handleTagToggle(tag);
                      }}
                      className="h-7"
                    >
                      Add Tag
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG value={document.url} size={80} level="H" includeMargin={false} />
                </div>
                <span className="text-xs text-muted-foreground">Scan to access</span>
              </div>
              <Button variant="outline" size="icon" asChild>
                <a href={document.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 border-t">
          <iframe src={`${document.url}#view=FitH`} className="w-full h-full" title={`Preview of ${document.name}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
