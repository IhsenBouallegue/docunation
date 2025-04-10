import { relations } from "drizzle-orm";
import { index, jsonb, pgSchema, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const docuSchema = pgSchema("docu");

export const shelves = docuSchema.table(
  "shelves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    embedding: vector({ dimensions: 1536 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("shelf_embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

export const folders = docuSchema.table(
  "folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    shelfId: uuid("shelf_id")
      .references(() => shelves.id)
      .notNull(),
    embedding: vector({ dimensions: 1536 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("folder_embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

export const documents = docuSchema.table(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    bucketName: text("bucket_name").notNull(),
    objectKey: text("object_key").notNull(),
    type: text("type").notNull(),
    content: text("content").notNull(),
    folderId: uuid("folder_id").references(() => folders.id),
    section: text("section"),
    tags: jsonb("tags").array(),
    embedding: vector({ dimensions: 1536 }).notNull(),
    documentContentHash: text("document_content_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("document_embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

export const shelvesRelations = relations(shelves, ({ many }) => ({
  folders: many(folders),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  shelf: one(shelves, {
    fields: [folders.shelfId],
    references: [shelves.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  folder: one(folders, {
    fields: [documents.folderId],
    references: [folders.id],
  }),
}));
