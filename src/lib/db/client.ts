import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleClient | null = null;

function init(): DrizzleClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está configurada");
  }
  const client = postgres(url, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });
  return drizzle(client, { schema });
}

export const db: DrizzleClient = new Proxy({} as DrizzleClient, {
  get(_target, prop, receiver) {
    if (!cached) cached = init();
    return Reflect.get(cached as object, prop, receiver);
  },
});

export type Database = typeof db;
export { schema };
