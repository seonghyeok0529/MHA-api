import { Pool, PoolClient, QueryResult } from "pg";
import { readFile } from "fs/promises";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const useSsl =
  process.env.PGSSLMODE === "require" ||
  databaseUrl.includes("render.com") ||
  process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  if (process.env.DB_DEBUG_LOGS === "true") {
    console.info("[db.query] start", {
      text: text.replace(/\s+/g, " ").trim(),
      paramsCount: params.length
    });
  }

  const result = await pool.query<T>(text, params);

  if (process.env.DB_DEBUG_LOGS === "true") {
    console.info("[db.query] success", {
      rowCount: result.rows.length
    });
  }

  return result;
}

export async function withTransaction<T>(handler: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) {
    return;
  }

  const schemaPath = path.resolve(process.cwd(), "sql", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf-8");
  await pool.query(schemaSql);
  initialized = true;
}
