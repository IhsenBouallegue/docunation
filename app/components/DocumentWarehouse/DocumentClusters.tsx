"use client";

import { applySuggestions, suggestDocumentLocations } from "@/app/actions/organize-documents";
import { toast } from "@/app/components/ui/use-toast";
import { useUpdateDocument } from "@/app/hooks/documents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FolderInput, Loader2 } from "lucide-react";
import { useState } from "react";

export function DocumentClusters() {
  const queryClient = useQueryClient();
  const { mutate: updateDoc, isPending: isUpdating } = useUpdateDocument();
  const [showReorganizeDialog, setShowReorganizeDialog] = useState(false);
  const [forceReorganize, setForceReorganize] = useState(false);

  const {
    data: suggestions = [],
    isPending: isCalculatingSuggestions,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ["document-suggestions"],
    queryFn: async () => {
      const result = await suggestDocumentLocations(forceReorganize);
      if (!result.success || !result.suggestions) {
        throw new Error(result.error ?? "Failed to organize documents");
      }
      return result.suggestions;
    },
  });

  const { mutate: applyAllSuggestions, isPending: isApplying } = useMutation({
    mutationFn: async () => {
      if (!suggestions.length) return;
      const result = await applySuggestions(suggestions);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to apply suggestions");
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Documents organized successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-suggestions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Document Organization</CardTitle>
          <CardDescription>
            Automatically organize your documents into folders based on their content similarity.
          </CardDescription>
        </div>
        {suggestions.length > 0 && (
          <Button
            size="sm"
            className="gap-2 w-full sm:w-auto"
            onClick={() => applyAllSuggestions()}
            disabled={isApplying}
          >
            {isApplying ? (
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
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                if (!forceReorganize) {
                  setShowReorganizeDialog(true);
                } else {
                  setForceReorganize(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (forceReorganize) {
                    setShowReorganizeDialog(true);
                  } else {
                    setForceReorganize(false);
                  }
                }
              }}
            >
              <Switch checked={forceReorganize} />
              <Label className="cursor-pointer">Force Complete Reorganization</Label>
            </div>
            <Button
              onClick={() => refetchSuggestions()}
              disabled={isCalculatingSuggestions}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Suggest Organization
            </Button>
          </div>

          {suggestions.length > 0 ? (
            <ScrollArea>
              <h3 className="mb-4 text-sm font-medium">Suggested Changes</h3>
              <div className="flex flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-muted/60 rounded-lg w-full"
                  >
                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-0">
                      <p className="text-sm font-medium truncate text-ellipsis">{suggestion.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">
                          {suggestion.currentLocation
                            ? `${suggestion.currentLocation.shelfName}-${suggestion.currentLocation.folderName}`
                            : "Unassigned"}
                        </span>
                        <ArrowRight className="h-4 w-4 hidden sm:block" />
                        <span className="font-medium text-foreground truncate">
                          {suggestion.suggestedLocation
                            ? `${suggestion.suggestedLocation.shelfName}-${suggestion.suggestedLocation.folderName}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            !isCalculatingSuggestions && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No organization changes suggested. Your documents are well organized!
              </div>
            )
          )}
          {isCalculatingSuggestions && (
            <div className="py-8 text-sm text-muted-foreground flex items-center justify-center">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating suggestions...
              </span>
            </div>
          )}
        </div>

        <AlertDialog open={showReorganizeDialog} onOpenChange={setShowReorganizeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Reorganization</AlertDialogTitle>
              <AlertDialogDescription>
                This will suggest a complete reorganization of all documents, potentially changing the location of every
                document in your system. This action cannot be undone until you manually apply the changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setForceReorganize(true);
                  refetchSuggestions();
                  setShowReorganizeDialog(false);
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
