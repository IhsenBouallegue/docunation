import { deleteDocument, getDocuments, updateDocument } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const result = await getDocuments();
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, data }: { documentId: string; data: Partial<Document> }) => {
      const result = await updateDocument(documentId, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      toast.error("Failed to update document");
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await deleteDocument(documentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
