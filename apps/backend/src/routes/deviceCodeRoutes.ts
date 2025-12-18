/**
 * Device Code Routes
 *
 * Handles /auth/device-code endpoints for TV authentication via mobile
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { deviceCodeService } from "../services/deviceCodeService";
import { authService } from "../services/authService";
import { pool } from "../utils/db";
import type {
  IDeviceCodeResponse,
  IDeviceCodeStatusResponse,
} from "../types/auth";

interface IDeviceCodeQueryParams {
  code: string;
}

interface IDeviceCodeApproveBody {
  code: string;
  email: string;
  password: string;
}

interface IDeviceCodeVerifyBody {
  code: string;
}

interface IDeviceCodeApproveSignUpBody {
  code: string;
  email: string;
  password: string;
  displayName: string;
}

interface IGenerateDeviceCodeQuery {
  authType?: "signin" | "signup";
}

export async function generateDeviceCodeRoute(
  request: FastifyRequest<{ Querystring: IGenerateDeviceCodeQuery }>,
  reply: FastifyReply
): Promise<IDeviceCodeResponse> {
  try {
    const authType = request.query.authType || "signin";
    const deviceCode = await deviceCodeService.generateDeviceCode(authType);
    return deviceCode;
  } catch (error) {
    reply.code(500);
    throw error;
  }
}

export async function checkDeviceCodeStatusRoute(
  request: FastifyRequest<{ Querystring: IDeviceCodeQueryParams }>,
  reply: FastifyReply
): Promise<IDeviceCodeStatusResponse> {
  const { code } = request.query;

  if (!code) {
    reply.code(400);
    return { status: "expired" };
  }

  const status = await deviceCodeService.checkDeviceCodeStatus(code);
  return status;
}

export async function verifyDeviceCodeRoute(
  request: FastifyRequest<{ Body: IDeviceCodeVerifyBody }>,
  reply: FastifyReply
): Promise<{
  success: boolean;
  authType?: "signin" | "signup";
  error?: string;
}> {
  const { code } = request.body;

  if (!code) {
    reply.code(400);
    return { success: false, error: "Code is required" };
  }

  try {
    const result = await pool.query<{
      auth_type: "signin" | "signup";
      status: string;
      expires_at: Date;
    }>(
      "SELECT auth_type, status, expires_at FROM device_codes WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Invalid code" };
    }

    const deviceCode = result.rows[0];

    if (new Date() > new Date(deviceCode.expires_at)) {
      return { success: false, error: "Code has expired" };
    }

    if (deviceCode.status !== "pending") {
      return { success: false, error: "Code already used" };
    }

    return { success: true, authType: deviceCode.auth_type };
  } catch (error) {
    console.error("❌ Error verifying device code:", error);
    reply.code(500);
    return { success: false, error: "Failed to verify code" };
  }
}

export async function approveDeviceCodeRoute(
  request: FastifyRequest<{ Body: IDeviceCodeApproveBody }>,
  reply: FastifyReply
): Promise<{ success: boolean; error?: string }> {
  const { code, email, password } = request.body;

  if (!code || !email || !password) {
    reply.code(400);
    return { success: false, error: "Code, email, and password are required" };
  }

  const loginResult = await authService.login({ email, password });

  if (!loginResult.success || !loginResult.user) {
    reply.code(401);
    return {
      success: false,
      error: loginResult.error || "Invalid credentials",
    };
  }

  const approved = await deviceCodeService.approveDeviceCode(
    code,
    loginResult.user.id
  );

  if (!approved) {
    reply.code(400);
    return { success: false, error: "Device code expired or already used" };
  }

  return { success: true };
}

export async function approveDeviceCodeWithSignUpRoute(
  request: FastifyRequest<{ Body: IDeviceCodeApproveSignUpBody }>,
  reply: FastifyReply
): Promise<{ success: boolean; error?: string }> {
  const { code, email, password, displayName } = request.body;

  if (!code || !email || !password) {
    reply.code(400);
    return { success: false, error: "Code, email, and password are required" };
  }

  const signupResult = await authService.signup({
    email,
    password,
    displayName,
  });

  if (!signupResult.success || !signupResult.user) {
    reply.code(400);
    return {
      success: false,
      error: signupResult.error || "Failed to create account",
    };
  }

  const approved = await deviceCodeService.approveDeviceCode(
    code,
    signupResult.user.id
  );

  if (!approved) {
    reply.code(400);
    return { success: false, error: "Device code expired or already used" };
  }

  return { success: true };
}
