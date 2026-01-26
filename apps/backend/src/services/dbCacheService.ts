/**
 * Database Cache Service
 *
 * Stores API responses in PostgreSQL for 24h to handle rate limits
 */

import { pool } from "../utils/db.js";
import type { ISeriesData } from "../types/series.js";

class DBCacheService {
  /**
   * Get cached series data from database (24h TTL)
   */
  async getSeries(symbol: string, period: string): Promise<ISeriesData | null> {
    try {
      const result = await pool.query(
        `SELECT data FROM stock_series_cache 
         WHERE symbol = $1 AND period = $2 
         AND expires_at > NOW()
         LIMIT 1`,
        [symbol, period],
      );

      if (result.rows.length > 0) {
        return result.rows[0].data as ISeriesData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store series data in database with 24h expiry
   */
  async setSeries(
    symbol: string,
    period: string,
    data: ISeriesData,
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO stock_series_cache (symbol, period, data, fetched_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '24 hours')
         ON CONFLICT (symbol, period) 
         DO UPDATE SET 
           data = $3,
           fetched_at = NOW(),
           expires_at = NOW() + INTERVAL '24 hours'`,
        [symbol, period, JSON.stringify(data)],
      );
    } catch (error) {}
  }

  /**
   * Clean up expired cache entries (optional, runs on cron)
   */
  async cleanExpired(): Promise<void> {
    try {
      const result = await pool.query(
        `DELETE FROM stock_series_cache WHERE expires_at < NOW()`,
      );
    } catch (error) {}
  }
}

export const dbCacheService = new DBCacheService();
