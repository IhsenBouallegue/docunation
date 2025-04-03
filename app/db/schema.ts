import { integer, jsonb, pgSchema, text, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core";

export const docuSchema = pgSchema("docu");

export const documents = docuSchema.table("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  shelf: integer("shelf"),
  folder: varchar("folder", { length: 1 }),
  section: text("section"),
  tags: jsonb("tags").array(),
  embedding: vector({ dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
