/**
 * Database Migration Script
 * Run with: npm run migrate
 */

import "dotenv/config";
import { pool } from "../src/utils/db";

async function runMigration() {
  console.log("🔄 Running database migration...\n");

  try {
    // Migration SQL
    const migrationSQL = `
-- Migration: Add auth_type column to device_codes table
-- This allows the TV to specify whether the user should sign up or sign in

ALTER TABLE device_codes ADD COLUMN IF NOT EXISTS auth_type VARCHAR(10) DEFAULT 'signin';

-- Update existing rows to have default value
UPDATE device_codes SET auth_type = 'signin' WHERE auth_type IS NULL;
`;

    console.log("📄 Executing migration:");
    console.log(migrationSQL);
    console.log("");

    // Execute the migration
    await pool.query(migrationSQL);

    console.log("✅ Migration completed successfully!\n");
    console.log("The 'auth_type' column has been added to device_codes table.");
    console.log("\nYou can now restart your backend server.");

    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'device_codes' AND column_name = 'auth_type';
    `);

    if (result.rows.length > 0) {
      console.log("\n✓ Verification: auth_type column exists");
      console.log(result.rows[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

