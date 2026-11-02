import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./desktop/main/database/schema.ts",
  out: "./desktop/main/database/migrations"
});
