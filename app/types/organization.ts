import type { folders, shelves } from "@/app/db/schema";
import type { InferSelectModel } from "drizzle-orm";

/**
 * Configuration for document organization
 */
export interface OrganizationConfig {
  maxFolders?: number; // Default: 10 (A-J)
  maxShelves?: number; // Default: 3 (1-3)
}

/**
 * Represents a document location change suggestion
 */
export interface DocumentLocationChange {
  id: string;
  name: string;
  currentFolderId: string | null;
  suggestedFolderId: string | null;
  currentLocation?: {
    shelfName: string;
    folderName: string;
  };
  suggestedLocation?: {
    shelfName: string;
    folderName: string;
  };
}
