import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgSchema, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const docuSchema = pgSchema("docu");
export const authSchema = pgSchema("auth");

export const shelves = docuSchema.table(
  "shelves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    embedding: vector({ dimensions: 1536 }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    embedding: vector({ dimensions: 1536 }),
    shelfId: uuid("shelf_id")
      .references(() => shelves.id)
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("document_embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

// ===============================================
// Auth Schema
// ===============================================

export const user = authSchema.table("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const session = authSchema.table("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = authSchema.table("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = authSchema.table("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const shelvesRelations = relations(shelves, ({ many, one }) => ({
  folders: many(folders),
  user: one(user, {
    fields: [shelves.userId],
    references: [user.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  shelf: one(shelves, {
    fields: [folders.shelfId],
    references: [shelves.id],
  }),
  documents: many(documents),
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  folder: one(folders, {
    fields: [documents.folderId],
    references: [folders.id],
  }),
  user: one(user, {
    fields: [documents.userId],
    references: [user.id],
  }),
}));
