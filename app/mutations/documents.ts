import { calculateDocumentEmbedding, deleteDocument, updateDocument } from "@/app/actions/documents";
import type { Document } from "@/app/types/document";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useCalculateDocumentEmbedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await calculateDocumentEmbedding(documentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
