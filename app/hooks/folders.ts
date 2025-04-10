import {
  createFolder,
  deleteFolder,
  getFolderById,
  getFolders,
  getFoldersWithDocuments,
  renameFolder,
} from "@/app/actions/folders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const result = await getFolders();
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useFoldersWithDocuments = (shelfId: string) => {
  return useQuery({
    queryKey: ["folders", shelfId],
    queryFn: async () => {
      const result = await getFoldersWithDocuments();
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useFolderById = (id: string) => {
  return useQuery({
    queryKey: ["folders", id],
    queryFn: async () => {
      const result = await getFolderById(id);
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useRenameFolder = (id: string) => {
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await renameFolder(id, name);
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useDeleteFolder = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await deleteFolder(id);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Folder deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete folder");
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, shelfId }: { name: string; shelfId: string }) => {
      const result = await createFolder(name, shelfId);
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Folder created successfully");
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error("Failed to create folder");
    },
  });
};
