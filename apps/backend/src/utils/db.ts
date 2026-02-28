/**
 * Database Connection Utility
 *
 * Connects to Neon PostgreSQL database
 */

import pg from "pg";
const { Pool } = pg;

let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL not configured - database operations will fail");
}

// Suppress SSL mode warning by using verify-full instead of require
if (DATABASE_URL && DATABASE_URL.includes("sslmode=require")) {
  DATABASE_URL = DATABASE_URL.replace("sslmode=require", "sslmode=verify-full");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    DATABASE_URL && DATABASE_URL.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

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
