import { z } from "zod";

// Document location schema
export const documentLocationSchema = z.object({
  storageUnit: z.string(),
  folderBox: z.string(),
});

// Main document schema
export const documentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  content: z.string(),
  location: documentLocationSchema.optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Export types
export type DocumentLocation = z.infer<typeof documentLocationSchema>;
export type Document = z.infer<typeof documentSchema>;

// Response types
export interface Response<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DocumentResponse extends Response<Document> {}

export interface DocumentsResponse extends Response<Document[]> {}
