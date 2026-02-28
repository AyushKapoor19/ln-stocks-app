/**
 * Error Handler Utilities
 *
 * Centralized error response handling following DRY principles
 */

import type { FastifyReply } from "fastify";

export interface IErrorResponse {
  success: false;
  error: string;
}

export interface ISuccessResponse {
  success: true;
}

/**
 * Send a standardized error response
 */
export function sendError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
): void {
  reply.code(statusCode).send({ success: false, error: message });
}

/**
 * Send a 400 Bad Request error
 */
export function sendBadRequest(
  reply: FastifyReply,
  message: string,
): void {
  sendError(reply, 400, message);
}

/**
 * Send a 401 Unauthorized error
 */
export function sendUnauthorized(
  reply: FastifyReply,
  message: string = "Unauthorized",
): void {
  sendError(reply, 401, message);
}

/**
 * Send a 500 Internal Server Error
 */
export function sendInternalError(
  reply: FastifyReply,
  message: string = "Internal server error",
): void {
  sendError(reply, 500, message);
}

/**
 * Send a 503 Service Unavailable error
 */
export function sendServiceUnavailable(
  reply: FastifyReply,
  message: string,
): void {
  sendError(reply, 503, message);
}
