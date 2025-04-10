"use server";

import { db } from "@/app/db";
import { documents, folders } from "@/app/db/schema";
import type { Folder, FolderWithDocuments, Response } from "@/app/types/document";
import { eq } from "drizzle-orm";

export async function createFolder(name: string, shelfId: string): Promise<Response<Folder>> {
  try {
    const [folder] = await db.insert(folders).values({ name, shelfId }).returning();
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFolders(): Promise<Response<Folder[]>> {
  try {
    const results = await db.query.folders.findMany();
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching folders:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function renameFolder(id: string, name: string): Promise<Response<Folder>> {
  try {
    const [updatedFolder] = await db.update(folders).set({ name }).where(eq(folders.id, id)).returning();
    return { success: true, data: updatedFolder };
  } catch (error) {
    console.error("Error updating folder:", error);
    return { success: false, error: (error as Error).message };
  }
}
export async function emptyFolder(id: string): Promise<Response<void>> {
  try {
    await db.update(documents).set({ folderId: null }).where(eq(documents.folderId, id));
    return { success: true };
  } catch (error) {
    console.error("Error emptying folder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteFolder(id: string): Promise<Response<void>> {
  try {
    await emptyFolder(id);
    await db.delete(folders).where(eq(folders.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFolderById(id: string): Promise<Response<Folder>> {
  try {
    const folder = await db.query.folders.findFirst({ where: eq(folders.id, id) });
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error fetching folder by ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFolderByName(name: string): Promise<Response<Folder>> {
  try {
    const folder = await db.query.folders.findFirst({ where: eq(folders.name, name) });
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error fetching folder by name:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFoldersByShelfId(shelfId: string): Promise<Response<Folder[]>> {
  try {
    const results = await db.query.folders.findMany({ where: eq(folders.shelfId, shelfId) });
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching folders by shelf ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFoldersWithDocuments(): Promise<Response<FolderWithDocuments[]>> {
  try {
    const results = await db.query.folders.findMany({
      with: {
        documents: true,
      },
    });
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching folders with documents:", error);
    return { success: false, error: (error as Error).message };
  }
}
