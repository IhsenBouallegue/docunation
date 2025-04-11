"use server";

import { db } from "@/app/db";
import { documents, folders } from "@/app/db/schema";
import type { Folder, FolderWithDocuments, Response } from "@/app/types/document";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function createFolder(name: string, shelfId: string): Promise<Response<Folder>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }
    const [folder] = await db.insert(folders).values({ name, shelfId, userId: session.user.id }).returning();
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFolders(): Promise<Response<Folder[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const results = await db.query.folders.findMany({ where: eq(folders.userId, session.user.id) });
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching folders:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function renameFolder(id: string, name: string): Promise<Response<Folder>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const [updatedFolder] = await db
      .update(folders)
      .set({ name })
      .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)))
      .returning();
    return { success: true, data: updatedFolder };
  } catch (error) {
    console.error("Error updating folder:", error);
    return { success: false, error: (error as Error).message };
  }
}
export async function emptyFolder(id: string): Promise<Response<void>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }
    await db
      .update(documents)
      .set({ folderId: null })
      .where(and(eq(documents.folderId, id), eq(documents.userId, session.user.id)));
    return { success: true };
  } catch (error) {
    console.error("Error emptying folder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteFolder(id: string): Promise<Response<void>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }
    await emptyFolder(id);
    await db.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, session.user.id)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFolderById(id: string): Promise<Response<Folder>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, id), eq(folders.userId, session.user.id)),
    });
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error fetching folder by ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFolderByName(name: string): Promise<Response<Folder>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.name, name), eq(folders.userId, session.user.id)),
    });
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error fetching folder by name:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFoldersByShelfId(shelfId: string): Promise<Response<Folder[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const results = await db.query.folders.findMany({
      where: and(eq(folders.shelfId, shelfId), eq(folders.userId, session.user.id)),
    });
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching folders by shelf ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getFoldersWithDocuments(): Promise<Response<FolderWithDocuments[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const results = await db.query.folders.findMany({
      where: eq(folders.userId, session.user.id),
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
