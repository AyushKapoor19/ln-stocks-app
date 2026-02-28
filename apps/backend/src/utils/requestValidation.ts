/**
 * Request Validation Helpers
 *
 * Reusable validation functions following DRY principles
 */

import type { FastifyReply } from "fastify";
import { sendBadRequest } from "./errorHandler.js";
import { parseSymbols } from "./validation.js";

/**
 * Validates required fields in request body
 * Returns error response if validation fails
 */
export function validateRequiredFields(
  reply: FastifyReply,
  fields: Record<string, unknown>,
  fieldNames: string[],
): boolean {
  const missing = fieldNames.filter((name) => !fields[name]);

  if (missing.length > 0) {
    const fieldList = missing.join(", ");
    sendBadRequest(reply, `${fieldList} ${missing.length > 1 ? "are" : "is"} required`);
    return false;
  }

  return true;
}

/**
 * Validates and parses symbols from query params
 * Returns null if validation fails (with error sent to reply)
 */
export function validateSymbols(
  symbolsParam: unknown,
  reply: FastifyReply,
): string[] | null {
  const symbols = parseSymbols(symbolsParam);

  if (symbols.length === 0) {
    sendBadRequest(reply, "symbols required");
    return null;
  }

  return symbols;
}

/**
 * Validates query parameter exists and is non-empty
 * Returns null if validation fails (with error sent to reply)
 */
export function validateQuery(
  queryParam: unknown,
  reply: FastifyReply,
  minLength: number = 1,
): string | null {
  const query = String(queryParam || "").trim();

  if (!query || query.length < minLength) {
    sendBadRequest(reply, "query required");
    return null;
  }

  return query;
}

/**
 * Validates device code fields
 */
export function validateDeviceCodeFields(
  code: unknown,
  email: unknown,
  password: unknown,
  reply: FastifyReply,
): boolean {
  return validateRequiredFields(
    reply,
    { code, email, password },
    ["code", "email", "password"],
  );
}
