import { Pool, PoolConfig, QueryResult } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const poolConfig: PoolConfig = {
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = new Pool(poolConfig);

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function closePool(): Promise<void> {
  await pool.end();
}
