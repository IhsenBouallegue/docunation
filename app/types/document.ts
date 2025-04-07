import type { documents } from "@/app/db/schema";
import type { InferSelectModel } from "drizzle-orm";
export type Document = InferSelectModel<typeof documents> & {
  url?: string;
};

// Response types
export interface Response<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DocumentResponse extends Response<Document> {}

export interface DocumentsResponse extends Response<Document[]> {}
