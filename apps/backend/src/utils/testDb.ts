/**
 * Database Connection Test Utility
 *
 * Run with: npm run test:db
 */

import "dotenv/config";
import { testConnection, pool } from "./db.js";

async function main() {
  console.log("Testing database connection...\n");
  const connected = await testConnection();

  if (connected) {
    console.log("Database connected successfully!\n");
    try {
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      if (tables.rows.length === 0) {
        console.log("No tables found in the database");
      } else {
        console.log("Found tables:");
        tables.rows.forEach((row) => {
          console.log(`   - ${row.table_name}`);
        });
      }
    } catch (error) {
      console.error("Error querying tables:", error);
    }
  } else {
    console.error("Failed to connect to database");
    console.error("Check DATABASE_URL in .env file");
  }

  await pool.end();
  process.exit(connected ? 0 : 1);
}

main();
