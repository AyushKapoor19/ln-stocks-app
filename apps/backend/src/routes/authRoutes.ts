/**
 * Authentication Routes
 *
 * Handles /auth endpoints for signup, login, and token verification
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/authService";
import type {
  ISignupRequest,
  ILoginRequest,
  IAuthResponse,
} from "../types/auth";

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
  reply: FastifyReply
): Promise<IAuthResponse> {
  const { email, password, displayName } = request.body;

  const signupRequest: ISignupRequest = { email, password, displayName };
  const result = await authService.signup(signupRequest);

  if (!result.success) {
    reply.code(400);
  }

  return result;
}

export async function loginRoute(
  request: FastifyRequest<{ Body: ILoginBody }>,
  reply: FastifyReply
): Promise<IAuthResponse> {
  const { email, password } = request.body;

  const loginRequest: ILoginRequest = { email, password };
  const result = await authService.login(loginRequest);

  if (!result.success) {
    reply.code(401);
  }

  return result;
}

export async function verifyTokenRoute(
  request: FastifyRequest<{ Headers: IVerifyHeaders }>,
  reply: FastifyReply
): Promise<IAuthResponse> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401);
    return { success: false, error: "No token provided" };
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    reply.code(401);
    return { success: false, error: "Invalid token" };
  }

  const user = await authService.findUserById(payload.userId);

  if (!user) {
    reply.code(401);
    return { success: false, error: "User not found" };
  }

  return {
    success: true,
    user,
    token,
  };
}
