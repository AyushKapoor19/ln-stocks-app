/**
 * Authentication Type Definitions
 */

export interface IUser {
  id: number;
  email: string;
  display_name: string | null;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface IUserWithPassword extends IUser {
  password_hash: string;
}

export interface ISignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  token?: string;
  user?: IUser;
  error?: string;
}

export interface IDeviceCode {
  id: number;
  code: string;
  user_id: number | null;
  status: "pending" | "approved" | "expired";
  created_at: Date;
  expires_at: Date;
  used_at: Date | null;
}

export interface IDeviceCodeResponse {
  code: string;
  qrCodeDataUrl: string;
  expiresAt: Date;
  pollInterval: number;
}

export interface IDeviceCodeStatusResponse {
  status: "pending" | "approved" | "expired";
  token?: string;
  user?: IUser;
}

export interface IJwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}
