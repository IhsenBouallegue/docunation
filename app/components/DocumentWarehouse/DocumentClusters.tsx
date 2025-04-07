"use client";

import { suggestDocumentLocations } from "@/app/actions/organize-documents";
import { useUpdateDocument } from "@/app/mutations/documents";
import type { DocumentLocationChange, OrganizationConfig } from "@/app/types/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, FolderInput, Loader2, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DocumentClusters() {
  const queryClient = useQueryClient();
  const { mutate: updateDoc, isPending: isUpdating } = useUpdateDocument();
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<OrganizationConfig>({
    maxFolders: 4,
    maxShelves: 2,
  });

  const {
    data: suggestions,
    isLoading,
    error,
    refetch,
  } = useQuery<DocumentLocationChange[]>({
    queryKey: ["document-suggestions", config],
    queryFn: async () => {
      const result = await suggestDocumentLocations(config);
      if (!result.success || !result.suggestions) {
        throw new Error(result.error);
      }
      return result.suggestions;
    },
  });

  const handleApplyChange = (change: DocumentLocationChange) => {
    updateDoc(
      {
        documentId: change.id,
        data: {
          shelf: change.suggestedLocation.shelf,
          folder: change.suggestedLocation.folder,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Updated location for "${change.name}"`);
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          queryClient.invalidateQueries({ queryKey: ["document-suggestions"] });
        },
        onError: (error) => {
          toast.error(`Failed to update location: ${error.message}`);
        },
      },
    );
  };

  const handleApplyAll = async () => {
    if (!changes.length) return;

    let successCount = 0;
    let failureCount = 0;

    // Process changes sequentially to avoid overwhelming the server
    for (const change of changes) {
      try {
        await new Promise<void>((resolve, reject) => {
          updateDoc(
            {
              documentId: change.id,
              data: {
                shelf: change.suggestedLocation.shelf,
                folder: change.suggestedLocation.folder,
              },
            },
            {
              onSuccess: () => {
                successCount++;
                resolve();
              },
              onError: (error) => {
                failureCount++;
                reject(error);
              },
            },
          );
        });
      } catch (error) {
        console.error(`Failed to update ${change.name}:`, error);
      }
    }

    // Show final summary
    if (successCount > 0) {
      toast.success(`Successfully updated ${successCount} document locations`);
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-suggestions"] });
    }
    if (failureCount > 0) {
      toast.error(`Failed to update ${failureCount} document locations`);
    }
  };

  const handleConfigChange = (key: keyof OrganizationConfig, value: string) => {
    const numValue = Number.parseInt(value, 10);
    if (Number.isNaN(numValue)) return;

    if (key === "maxFolders" && (numValue < 1 || numValue > 26)) {
      toast.error("Number of folders must be between 1 and 26");
      return;
    }

    if (key === "maxShelves" && numValue < 1) {
      toast.error("Number of shelves must be at least 1");
      return;
    }

    setConfig((prev) => ({ ...prev, [key]: numValue }));
  };

  // Calculate changes from suggestions
  const changes =
    suggestions?.filter(
      (suggestion) =>
        suggestion.currentLocation?.shelf !== suggestion.suggestedLocation.shelf ||
        suggestion.currentLocation?.folder !== suggestion.suggestedLocation.folder,
    ) ?? [];

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Organization Suggestions</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          {changes.length > 0 && (
            <Button size="sm" className="gap-2" onClick={handleApplyAll} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <FolderInput className="h-4 w-4" />
                  Apply All Changes
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showSettings && (
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxFolders">Maximum Folders (1-26)</Label>
                <Input
                  id="maxFolders"
                  type="number"
                  min={1}
                  max={26}
                  value={config.maxFolders}
                  onChange={(e) => handleConfigChange("maxFolders", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxShelves">Maximum Shelves (min: 1)</Label>
                <Input
                  id="maxShelves"
                  type="number"
                  min={1}
                  value={config.maxShelves}
                  onChange={(e) => handleConfigChange("maxShelves", e.target.value)}
                />
              </div>
            </div>
            <Button size="sm" onClick={() => refetch()}>
              Recalculate Suggestions
            </Button>
          </div>
        )}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-destructive">
              Error loading suggestions: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : changes.length > 0 ? (
            <div className="space-y-4">
              {changes.map((change) => (
                <div key={change.id} className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{change.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>
                        {change.currentLocation?.shelf && change.currentLocation?.folder
                          ? `${change.currentLocation.shelf}-${change.currentLocation.folder}`
                          : "Unsorted"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {change.suggestedLocation.shelf}-{change.suggestedLocation.folder}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleApplyChange(change)} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No organization changes suggested. Your documents are well organized!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
