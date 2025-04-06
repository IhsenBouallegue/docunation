"use client";

import { getDocumentClusters } from "@/app/actions/document-clusters";
import { useUpdateDocument } from "@/app/mutations/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, FolderInput, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentCluster {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
    currentLocation?: {
      shelf?: number;
      folder?: string;
    };
    suggestedLocation?: {
      shelf?: number;
      folder?: string;
    };
  }>;
}

interface LocationChange {
  documentId: string;
  documentName: string;
  from: { shelf?: number; folder?: string };
  to: { shelf?: number; folder?: string };
}

export function DocumentClusters() {
  const queryClient = useQueryClient();
  const { mutate: updateDoc, isPending: isUpdating } = useUpdateDocument();

  const {
    data: clusters,
    isLoading,
    error,
  } = useQuery<DocumentCluster[]>({
    queryKey: ["document-clusters"],
    queryFn: async () => {
      const result = await getDocumentClusters();
      if (!result.success || !result.clusters) {
        throw new Error(result.error);
      }
      return result.clusters;
    },
  });

  const handleApplyChange = (change: LocationChange) => {
    updateDoc(
      {
        documentId: change.documentId,
        data: {
          shelf: change.to.shelf,
          folder: change.to.folder,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Updated location for "${change.documentName}"`);
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          queryClient.invalidateQueries({ queryKey: ["document-clusters"] });
        },
        onError: (error) => {
          toast.error(`Failed to update location: ${error.message}`);
        },
      },
    );
  };

  const handleApplyAll = async () => {
    let successCount = 0;
    let failureCount = 0;

    // Process changes sequentially to avoid overwhelming the server
    for (const change of changes) {
      try {
        await new Promise<void>((resolve, reject) => {
          updateDoc(
            {
              documentId: change.documentId,
              data: {
                shelf: change.to.shelf,
                folder: change.to.folder,
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
        console.error(`Failed to update ${change.documentName}:`, error);
      }
    }

    // Show final summary
    if (successCount > 0) {
      toast.success(`Successfully updated ${successCount} document locations`);
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-clusters"] });
    }
    if (failureCount > 0) {
      toast.error(`Failed to update ${failureCount} document locations`);
    }
  };

  // Calculate suggested changes
  const changes: LocationChange[] = [];

  if (clusters) {
    for (const [clusterIndex, cluster] of clusters.entries()) {
      // Determine most common shelf and folder in the cluster
      const locations = cluster.documents
        .map((doc) => doc.currentLocation)
        .filter((loc): loc is NonNullable<typeof loc> => !!loc);

      const shelves = locations.map((loc) => loc.shelf).filter((s): s is number => s !== undefined);
      const folders = locations.map((loc) => loc.folder).filter((f): f is string => f !== undefined);

      // Calculate suggested location based on cluster
      const suggestedShelf = shelves.length > 0 ? Math.min(...shelves) : clusterIndex + 1;
      const suggestedFolder = folders.length > 0 ? folders.sort()[0] : String.fromCharCode(65 + (clusterIndex % 26));

      // Find documents that need to be moved
      for (const doc of cluster.documents) {
        const currentLoc = doc.currentLocation || {};
        if (currentLoc.shelf !== suggestedShelf || currentLoc.folder !== suggestedFolder) {
          changes.push({
            documentId: doc.id,
            documentName: doc.name,
            from: currentLoc,
            to: { shelf: suggestedShelf, folder: suggestedFolder },
          });
        }
      }
    }
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Organization Suggestions</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {changes.length > 0 ? (
            <div className="space-y-4">
              {changes.map((change) => (
                <div
                  key={change.documentId}
                  className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{change.documentName}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>
                        {change.from.shelf && change.from.folder
                          ? `${change.from.shelf}-${change.from.folder}`
                          : "Unsorted"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {change.to.shelf}-{change.to.folder}
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
