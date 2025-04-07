/**
 * Configuration for document organization
 */
export interface OrganizationConfig {
  maxFolders?: number; // Default: 10 (A-J)
  maxShelves?: number; // Default: 3 (1-3)
}

/**
 * Location within the physical storage system
 */
export interface Location {
  shelf?: number;
  folder?: string;
}

/**
 * Suggested location with required fields
 */
export interface SuggestedLocation {
  shelf: number;
  folder: string;
}

/**
 * Represents a document location change suggestion
 */
export interface DocumentLocationChange {
  id: string;
  name: string;
  currentLocation?: Location;
  suggestedLocation: SuggestedLocation;
}
