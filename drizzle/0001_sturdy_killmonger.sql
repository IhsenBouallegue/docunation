CREATE SCHEMA "docu";
--> statement-breakpoint
CREATE TABLE "docu"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"bucket_name" text NOT NULL,
	"object_key" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"shelf" integer,
	"folder" varchar(1),
	"section" text,
	"tags" jsonb[],
	"embedding" vector(1536) NOT NULL,
	"document_content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "embedding_index" ON "docu"."documents" USING hnsw ("embedding" vector_cosine_ops);