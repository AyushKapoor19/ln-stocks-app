/**
 * Authentication API Service
 *
 * Handles authentication API calls including signup, login, device codes, and token management
 */

import { BaseApiService, StorageHelper } from "./baseApi";
import type {
  IAuthResponse,
  ISignInData,
  IDeviceCodeResponse,
  IDeviceCodeStatusResponse,
} from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://ln-stocks-backend.onrender.com";
const AUTH_TOKEN_KEY = "auth_token";
const NETWORK_ERROR: IAuthResponse = { success: false, error: "Network error" };

class AuthApiService extends BaseApiService {
  constructor() {
    super(API_BASE_URL);
  }

  async signup(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<IAuthResponse> {
    const result = await this.post<IAuthResponse>("/auth/signup", {
      email,
      password,
      displayName,
    });
    return result || NETWORK_ERROR;
  }

  async login(data: ISignInData): Promise<IAuthResponse> {
    const result = await this.post<IAuthResponse>("/auth/login", data);
    return result || NETWORK_ERROR;
  }

  async generateDeviceCode(
    authType: "signin" | "signup" = "signin",
  ): Promise<IDeviceCodeResponse | null> {
    return this.post<IDeviceCodeResponse>(
      `/auth/device-code/generate?authType=${authType}`,
    );
  }

  async checkDeviceCodeStatus(
    code: string,
  ): Promise<IDeviceCodeStatusResponse | null> {
    return this.get<IDeviceCodeStatusResponse>(
      `/auth/device-code/status?code=${encodeURIComponent(code)}`,
    );
  }

  async verifyToken(token: string): Promise<IAuthResponse> {
    const result = await this.get<IAuthResponse>("/auth/verify", {
      Authorization: `Bearer ${token}`,
    });
    return result || NETWORK_ERROR;
  }

  saveToken(token: string): void {
    StorageHelper.setItem(AUTH_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return StorageHelper.getItem(AUTH_TOKEN_KEY);
  }

  clearToken(): void {
    StorageHelper.removeItem(AUTH_TOKEN_KEY);
  }
}

export const authApi = new AuthApiService();
