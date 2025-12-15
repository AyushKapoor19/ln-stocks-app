/**
 * Device Code Routes
 * 
 * Handles /auth/device-code endpoints for TV authentication via mobile
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { deviceCodeService } from '../services/deviceCodeService';
import { authService } from '../services/authService';
import type { IDeviceCodeResponse, IDeviceCodeStatusResponse } from '../types/auth';

interface IDeviceCodeQueryParams {
  code: string;
}

interface IDeviceCodeApproveBody {
  code: string;
  email: string;
  password: string;
}

export async function generateDeviceCodeRoute(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<IDeviceCodeResponse> {
  try {
    const deviceCode = await deviceCodeService.generateDeviceCode();
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
    return { status: 'expired' };
  }

  const status = await deviceCodeService.checkDeviceCodeStatus(code);
  return status;
}

export async function approveDeviceCodeRoute(
  request: FastifyRequest<{ Body: IDeviceCodeApproveBody }>,
  reply: FastifyReply
): Promise<{ success: boolean; error?: string }> {
  const { code, email, password } = request.body;

  if (!code || !email || !password) {
    reply.code(400);
    return { success: false, error: 'Code, email, and password are required' };
  }

  const loginResult = await authService.login({ email, password });

  if (!loginResult.success || !loginResult.user) {
    reply.code(401);
    return { success: false, error: loginResult.error || 'Invalid credentials' };
  }

  const approved = await deviceCodeService.approveDeviceCode(code, loginResult.user.id);

  if (!approved) {
    reply.code(400);
    return { success: false, error: 'Device code expired or already used' };
  }

  return { success: true };
}

