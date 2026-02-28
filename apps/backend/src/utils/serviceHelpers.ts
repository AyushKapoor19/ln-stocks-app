/**
 * Service Helper Utilities
 *
 * Reusable helpers for services following DRY principles
 */

import type { Pool, QueryResult, QueryResultRow } from "pg";

/**
 * Round number to specified decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Execute a database query and return the first result or null
 * Eliminates repeated try-catch-null patterns
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  query: string,
  params: unknown[] = [],
): Promise<T | null> {
  try {
    const result = await pool.query<T>(query, params);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    return null;
  }
}

/**
 * Execute a database query and return all results or empty array
 */
export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const result = await pool.query<T>(query, params);
    return result.rows;
  } catch (error) {
    return [];
  }
}

/**
 * Execute a database command that doesn't return data
 * Logs errors but doesn't throw
 */
export async function executeCommand(
  pool: Pool,
  query: string,
  params: unknown[] = [],
): Promise<boolean> {
  try {
    await pool.query(query, params);
    return true;
  } catch (error) {
    console.error("Database command failed:", error);
    return false;
  }
}

/**
 * Safe async operation wrapper that returns null on error
 * Eliminates repeated try-catch-null patterns
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T | null = null,
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    return fallback;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password requirements
 * Returns error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/[a-zA-Z]/.test(password)) {
    return "Password must contain at least one letter";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }

  return null;
}

/**
 * Check if API key is configured
 * Returns true if key exists and is non-empty
 */
export function hasApiKey(key: string | undefined): boolean {
  return !!key && key.length > 0;
}
