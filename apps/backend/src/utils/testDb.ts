/**
 * Database Connection Test Utility
 *
 * Run with: npm run test:db
 */

import "dotenv/config";
import { testConnection, pool } from "./db.js";

async function main() {
  const connected = await testConnection();

  if (connected) {
    try {
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      if (tables.rows.length === 0) {
      } else {
        tables.rows.forEach((row) => {});
      }
    } catch (error) {}
  } else {
  }

  await pool.end();
  process.exit(connected ? 0 : 1);
}

main();
