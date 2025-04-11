"use server";

import { db } from "@/app/db";
import { shelves } from "@/app/db/schema";
import type { Response, Shelf, ShelfWithFolders } from "@/app/types/document";
import { auth } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function createShelf(name: string): Promise<Response<Shelf>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const [shelf] = await db.insert(shelves).values({ name, userId: session.user.id }).returning();
    return { success: true, data: shelf };
  } catch (error) {
    console.error("Error creating shelf:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getShelves(): Promise<Response<ShelfWithFolders[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const results = await db.query.shelves.findMany({
      where: eq(shelves.userId, session.user.id),
      with: {
        folders: {
          with: {
            documents: true,
          },
        },
      },
      orderBy: asc(shelves.createdAt),
    });
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching shelves:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function renameShelf(id: string, name: string): Promise<Response<Shelf>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const [updatedShelf] = await db
      .update(shelves)
      .set({ name })
      .where(and(eq(shelves.id, id), eq(shelves.userId, session.user.id)))
      .returning();
    return { success: true, data: updatedShelf };
  } catch (error) {
    console.error("Error updating shelf:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteShelf(id: string): Promise<Response<void>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    await db.delete(shelves).where(and(eq(shelves.id, id), eq(shelves.userId, session.user.id)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting shelf:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getShelfById(id: string): Promise<Response<Shelf>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const shelf = await db.query.shelves.findFirst({
      where: and(eq(shelves.id, id), eq(shelves.userId, session.user.id)),
    });
    return { success: true, data: shelf };
  } catch (error) {
    console.error("Error fetching shelf by ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getShelfByName(name: string): Promise<Response<Shelf>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const shelf = await db.query.shelves.findFirst({
      where: and(eq(shelves.name, name), eq(shelves.userId, session.user.id)),
    });
    return { success: true, data: shelf };
  } catch (error) {
    console.error("Error fetching shelf by name:", error);
    return { success: false, error: (error as Error).message };
  }
}
