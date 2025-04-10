import type { documents, folders, shelves } from "@/app/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type Shelf = InferSelectModel<typeof shelves>;
export type Folder = InferSelectModel<typeof folders>;
export type Document = InferSelectModel<typeof documents> & { url?: string };
export type ShelfWithFolders = Shelf & { folders: Folder[] };
export type FolderWithDocuments = Folder & { documents: Document[] };

// Response types
export interface Response<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DocumentResponse extends Response<Document> {}

export interface DocumentsResponse extends Response<Document[]> {}
