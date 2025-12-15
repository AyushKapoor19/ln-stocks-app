/**
 * Frontend Authentication Types
 */

export interface IUser {
  id: number;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface IAuthResponse {
  success: boolean;
  token?: string;
  user?: IUser;
  error?: string;
}

export interface IDeviceCodeResponse {
  code: string;
  qrCodeDataUrl: string;
  expiresAt: string;
  pollInterval: number;
}

export interface IDeviceCodeStatusResponse {
  status: 'pending' | 'approved' | 'expired';
  token?: string;
  user?: IUser;
}

export interface ISignInData {
  email: string;
  password: string;
}

