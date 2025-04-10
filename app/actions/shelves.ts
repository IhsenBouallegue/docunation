"use server";

import { db } from "@/app/db";
import { shelves } from "@/app/db/schema";
import type { Response, Shelf, ShelfWithFolders } from "@/app/types/document";
import { asc, eq } from "drizzle-orm";

export async function createShelf(name: string): Promise<Response<Shelf>> {
  try {
    const [shelf] = await db.insert(shelves).values({ name }).returning();
    return { success: true, data: shelf };
  } catch (error) {
    console.error("Error creating shelf:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getShelves(): Promise<Response<ShelfWithFolders[]>> {
  try {
    const results = await db.query.shelves.findMany({
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
    const [updatedShelf] = await db.update(shelves).set({ name }).where(eq(shelves.id, id)).returning();
    return { success: true, data: updatedShelf };
  } catch (error) {
    console.error("Error updating shelf:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteShelf(id: string): Promise<Response<void>> {
  try {
    await db.delete(shelves).where(eq(shelves.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting shelf:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getShelfById(id: string): Promise<Response<Shelf>> {
  try {
    const shelf = await db.query.shelves.findFirst({ where: eq(shelves.id, id) });
    return { success: true, data: shelf };
  } catch (error) {
    console.error("Error fetching shelf by ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getShelfByName(name: string): Promise<Response<Shelf>> {
  try {
    const shelf = await db.query.shelves.findFirst({ where: eq(shelves.name, name) });
    return { success: true, data: shelf };
  } catch (error) {
    console.error("Error fetching shelf by name:", error);
    return { success: false, error: (error as Error).message };
  }
}
