import { index, integer, jsonb, pgSchema, text, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core";

export const docuSchema = pgSchema("docu");

export const documents = docuSchema.table(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    bucketName: text("bucket_name").notNull(),
    objectKey: text("object_key").notNull(),
    type: text("type").notNull(),
    content: text("content").notNull(),
    shelf: integer("shelf"),
    folder: varchar("folder", { length: 1 }),
    section: text("section"),
    tags: jsonb("tags").array(),
    embedding: vector({ dimensions: 1536 }).notNull(),
    documentContentHash: text("document_content_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    embeddingIndex: index("embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops")),
  }),
);
