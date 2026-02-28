/**
 * Database Cache Service
 *
 * Stores API responses in PostgreSQL for 24h to handle rate limits
 */

import { pool } from "../utils/db.js";
import { queryOne, executeCommand } from "../utils/serviceHelpers.js";
import type { ISeriesData } from "../types/series.js";

class DBCacheService {
  /**
   * Get cached series data from database (24h TTL)
   */
  async getSeries(symbol: string, period: string): Promise<ISeriesData | null> {
    const result = await queryOne<{ data: ISeriesData }>(
      pool,
      `SELECT data FROM stock_series_cache 
       WHERE symbol = $1 AND period = $2 
       AND expires_at > NOW()
       LIMIT 1`,
      [symbol, period],
    );

    return result ? result.data : null;
  }

  /**
   * Store series data in database with 24h expiry
   */
  async setSeries(
    symbol: string,
    period: string,
    data: ISeriesData,
  ): Promise<void> {
    await executeCommand(
      pool,
      `INSERT INTO stock_series_cache (symbol, period, data, fetched_at, expires_at)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '24 hours')
       ON CONFLICT (symbol, period) 
       DO UPDATE SET 
         data = $3,
         fetched_at = NOW(),
         expires_at = NOW() + INTERVAL '24 hours'`,
      [symbol, period, JSON.stringify(data)],
    );
  }

  /**
   * Clean up expired cache entries (optional, runs on cron)
   */
  async cleanExpired(): Promise<void> {
    await executeCommand(
      pool,
      `DELETE FROM stock_series_cache WHERE expires_at < NOW()`,
    );
  }
}

export const dbCacheService = new DBCacheService();
