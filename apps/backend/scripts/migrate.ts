/**
 * Database Migration Script
 * Run with: npm run migrate
 */

import "dotenv/config";
import { pool } from "../src/utils/db";

async function runMigration() {
  try {
    // Migration 1: auth_type column
    await pool.query(`
      ALTER TABLE device_codes ADD COLUMN IF NOT EXISTS auth_type VARCHAR(10) DEFAULT 'signin';
      UPDATE device_codes SET auth_type = 'signin' WHERE auth_type IS NULL;
    `);

    // Migration 2: Stock series cache table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_series_cache (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        period VARCHAR(10) NOT NULL,
        data JSONB NOT NULL,
        fetched_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(symbol, period)
      );

      CREATE INDEX IF NOT EXISTS idx_stock_series_lookup 
        ON stock_series_cache(symbol, period, expires_at);

      CREATE INDEX IF NOT EXISTS idx_stock_series_expires 
        ON stock_series_cache(expires_at);
    `);

    await pool.end();
    process.exit(0);
  } catch (error) {
    await pool.end();
    process.exit(1);
  }
}

runMigration();
