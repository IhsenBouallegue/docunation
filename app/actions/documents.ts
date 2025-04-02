"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import type { Document, DocumentResponse, DocumentsResponse } from "@/app/types/document";
import { eq } from "drizzle-orm";

export async function saveDocument(data: Document): Promise<DocumentResponse> {
  try {
    const [document] = await db
      .insert(documents)
      .values({
        name: data.name,
        url: data.url,
        type: data.type,
        content: data.content,
        location: data.location,
        tags: data.tags,
      })
      .returning();
    return { success: true, document: document as Document };
  } catch (error) {
    console.error("Error saving document:", error);
    return { success: false, error: "Failed to save document" };
  }
}

export async function getDocuments(): Promise<DocumentsResponse> {
  try {
    const allDocuments = await db.select().from(documents);
    return { success: true, documents: allDocuments as Document[] };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

export async function updateDocument(id: string, data: Partial<Document>): Promise<DocumentResponse> {
  try {
    const [document] = await db
      .update(documents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return { success: true, document: document as Document };
  } catch (error) {
    console.error("Error updating document:", error);
    return { success: false, error: "Failed to update document" };
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(documents).where(eq(documents.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}
