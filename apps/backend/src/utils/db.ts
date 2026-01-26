/**
 * Database Connection Utility
 *
 * Connects to Neon PostgreSQL database
 */

import pg from "pg";
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    DATABASE_URL && DATABASE_URL.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
});

pool.on("error", (err) => {});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();

    return true;
  } catch (error) {
    return false;
  }
}
