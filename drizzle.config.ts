import { defineConfig } from "drizzle-kit";

// drizzle-kit corre fuera de Next.js: cargar .env.local manualmente.
// Migraciones via pooler en session mode (DATABASE_URL_SESSION).
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_SESSION!,
  },
});
