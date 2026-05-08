import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL no está configurada");
}

const client = postgres(url ?? "postgres://localhost/personal_tracker_stub", {
  max: 5,
  idle_timeout: 20,
  prepare: false,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
export { schema };
