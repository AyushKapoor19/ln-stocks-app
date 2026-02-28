/**
 * Authentication Types
 *
 * Type definitions for authentication-related data structures
 */

export interface ISignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface IDeviceCodeVerifyResponse {
  success: boolean;
  authType?: "signup" | "signin";
  error?: string;
}

export interface IDeviceCodeApprovalResponse {
  success: boolean;
  error?: string;
}
