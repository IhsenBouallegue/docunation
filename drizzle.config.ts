import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  schemaFilter: "docu",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://mastra_owner:npg_dNCQAF9I1hXZ@ep-wild-pond-a8f65jpz-pooler.eastus2.azure.neon.tech/mastra?sslmode=require",
  },
} satisfies Config;
