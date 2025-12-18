/**
 * Authentication Types
 *
 * Type definitions for authentication-related data structures
 */

export interface IUser {
  id: number;
  email: string;
  display_name?: string;
  created_at: string;
}

export interface ISignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface ISignInData {
  email: string;
  password: string;
}

export interface IDeviceCodeVerifyResponse {
  success: boolean;
  authType?: "signup" | "signin";
  error?: string;
}

export interface IAuthResponse {
  success: boolean;
  user?: IUser;
  token?: string;
  error?: string;
}

export interface IDeviceCodeApprovalResponse {
  success: boolean;
  error?: string;
}
