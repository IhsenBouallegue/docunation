import { z } from "zod";

// Document location validation
const shelfSchema = z.number().int().min(1);
const folderSchema = z
  .string()
  .length(1)
  .regex(/^[A-Z]$/);
const sectionSchema = z.string();

// Main document schema
export const documentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  bucketName: z.string(),
  objectKey: z.string(),
  url: z.string().optional(), // URL is generated on demand
  type: z.string(),
  content: z.string(),
  shelf: shelfSchema.optional(),
  folder: folderSchema.optional(),
  section: sectionSchema.optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Export types
export type Document = z.infer<typeof documentSchema>;

// Response types
export interface Response<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DocumentResponse extends Response<Document> {}

export interface DocumentsResponse extends Response<Document[]> {}
