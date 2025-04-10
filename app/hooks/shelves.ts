import { createShelf, getShelfById, getShelfByName, getShelves, renameShelf } from "@/app/actions/shelves";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useShelves = () => {
  return useQuery({
    queryKey: ["shelves"],
    queryFn: async () => {
      const result = await getShelves();
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useShelfById = (id: string) => {
  return useQuery({
    queryKey: ["shelves", id],
    queryFn: async () => {
      const result = await getShelfById(id);
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useShelfByName = (name: string) => {
  return useQuery({
    queryKey: ["shelves", name],
    queryFn: async () => {
      const result = await getShelfByName(name);
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useCreateShelf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createShelf(name);
      if (!result.success || !result.data) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Shelf created successfully");
    },
    onError: () => {
      toast.error("Failed to create shelf");
    },
  });
};

export const useRenameShelf = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => await renameShelf(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Shelf updated successfully");
    },
    onError: () => {
      toast.error("Failed to update shelf");
    },
  });
};
