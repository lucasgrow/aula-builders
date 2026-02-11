import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";
export * from "./schema";

type DbInstance = DrizzleD1Database<typeof schema>;

const GLOBAL_DB_KEY = Symbol.for("cloudflare-builder.db");

type GlobalWithDb = typeof globalThis & {
  [GLOBAL_DB_KEY]?: DbInstance;
};

function createDevDb() {
  // eslint-disable-next-line
  const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");
  // eslint-disable-next-line
  const Database = require("better-sqlite3");
  // eslint-disable-next-line
  const { resolve, join } = require("node:path");
  // eslint-disable-next-line
  const { readdirSync } = require("node:fs");

  const d1Dir = resolve(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  const files = readdirSync(d1Dir);
  const sqliteFile = files.find((f: string) => f.endsWith(".sqlite"));

  if (!sqliteFile) {
    throw new Error(
      "No local D1 database found. Run: bun run setup"
    );
  }

  const dbPath = join(d1Dir, sqliteFile);
  const sqlite = Database.default
    ? new Database.default(dbPath)
    : new Database(dbPath);
  return drizzleSqlite(sqlite, { schema });
}

function createProdDb() {
  const { env } = getCloudflareContext();
  const binding = env.DATABASE;

  if (!binding) {
    throw new Error("DATABASE binding is not available in the current context.");
  }

  return drizzle(binding, { schema });
}

export function getDb(): DbInstance {
  const g = globalThis as GlobalWithDb;

  if (g[GLOBAL_DB_KEY]) return g[GLOBAL_DB_KEY]!;

  const isDev = process.env.NODE_ENV === "development";
  const db = isDev ? createDevDb() : createProdDb();

  if (isDev) {
    g[GLOBAL_DB_KEY] = db;
  }

  return db;
}
