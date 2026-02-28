/**
 * Authentication Routes
 *
 * Handles /auth endpoints for signup, login, and token verification
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/authService.js";
import { sendBadRequest, sendUnauthorized } from "../utils/errorHandler.js";
import type {
  ISignupRequest,
  ILoginRequest,
  IAuthResponse,
} from "../types/auth.js";

interface ISignupBody {
  email: string;
  password: string;
  displayName?: string;
}

interface ILoginBody {
  email: string;
  password: string;
}

interface IVerifyHeaders {
  authorization?: string;
}

export async function signupRoute(
  request: FastifyRequest<{ Body: ISignupBody }>,
  reply: FastifyReply,
): Promise<IAuthResponse> {
  const { email, password, displayName } = request.body;

  const signupRequest: ISignupRequest = { email, password, displayName };
  const result = await authService.signup(signupRequest);

  if (!result.success) {
    sendBadRequest(reply, result.error || "Signup failed");
  }

  return result;
}

export async function loginRoute(
  request: FastifyRequest<{ Body: ILoginBody }>,
  reply: FastifyReply,
): Promise<IAuthResponse> {
  const { email, password } = request.body;

  const loginRequest: ILoginRequest = { email, password };
  const result = await authService.login(loginRequest);

  if (!result.success) {
    sendUnauthorized(reply, result.error || "Login failed");
  }

  return result;
}

export async function verifyTokenRoute(
  request: FastifyRequest<{ Headers: IVerifyHeaders }>,
  reply: FastifyReply,
): Promise<IAuthResponse> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendUnauthorized(reply, "No token provided");
    return { success: false, error: "No token provided" };
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    sendUnauthorized(reply, "Invalid token");
    return { success: false, error: "Invalid token" };
  }

  const user = await authService.findUserById(payload.userId);

  if (!user) {
    sendUnauthorized(reply, "User not found");
    return { success: false, error: "User not found" };
  }

  return {
    success: true,
    user,
    token,
  };
}
