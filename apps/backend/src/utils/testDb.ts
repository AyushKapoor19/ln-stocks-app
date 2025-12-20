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
    console.log("\n✅ Database connection successful!");
    console.log("\nTesting tables...");

    try {
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      if (tables.rows.length === 0) {
        console.log("No tables found. Run schema.sql in Neon SQL Editor.");
      } else {
        console.log("\nFound tables:");
        tables.rows.forEach((row) => {
          console.log(`   - ${row.table_name}`);
        });
      }
    } catch (error) {
      console.error("❌ Error querying tables:", error);
    }
  } else {
    console.log("\n❌ Database connection failed!");
    console.log("Make sure DATABASE_URL is set in .env file");
  }

  await pool.end();
  process.exit(connected ? 0 : 1);
}

main();
