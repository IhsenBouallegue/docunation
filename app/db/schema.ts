import { jsonb, pgSchema, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const docuSchema = pgSchema("docu");

export const documents = docuSchema.table("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  location: jsonb("location"),
  tags: jsonb("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
