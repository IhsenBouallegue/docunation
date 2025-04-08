import { config } from "dotenv";
import type { Config } from "drizzle-kit";
config({ path: ".env" });

export default {
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  schemaFilter: "docu",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_CONNECTION_STRING || "",
  },
} satisfies Config;
