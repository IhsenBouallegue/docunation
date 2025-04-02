"use server";

import { db } from "@/app/db";
import { documents } from "@/app/db/schema";
import { mastra } from "@/mastra";
import { eq } from "drizzle-orm";

export async function deleteDocument(documentId: string) {
  try {
    console.log(`Starting document deletion for document ${documentId}`);

    // Delete chunks from vector store
    const vectorStore = mastra.getVector("pgVector");

    vectorStore.deleteIndexById("embeddings", documentId);
    console.log(`Deleted chunks from vector store for document ${documentId}`);

    // Delete document from database
    await db.delete(documents).where(eq(documents.id, documentId));
    console.log(`Deleted document ${documentId} from database`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: (error as Error).message };
  }
}
