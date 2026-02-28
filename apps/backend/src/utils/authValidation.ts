/**
 * Authentication Validation Utilities
 *
 * Reusable validation for auth operations
 */

import type { IAuthResponse } from "../types/auth.js";

/**
 * Validate required email and password
 * Returns error response if validation fails, null if valid
 */
export function validateEmailPassword(
  email: unknown,
  password: unknown,
): IAuthResponse | null {
  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }
  return null;
}
