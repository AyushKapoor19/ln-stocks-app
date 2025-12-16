/**
 * Authentication API Service
 *
 * Handles authentication API calls
 */

import type {
  IAuthResponse,
  ISignInData,
  IDeviceCodeResponse,
  IDeviceCodeStatusResponse,
} from "../types/auth";

class AuthApiService {
  private baseUrl = "http://localhost:8787";

  async signup(
    email: string,
    password: string,
    displayName?: string
  ): Promise<IAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Signup failed:", error);
      return { success: false, error: "Network error" };
    }
  }

  async login(data: ISignInData): Promise<IAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Network error" };
    }
  }

  async generateDeviceCode(): Promise<IDeviceCodeResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/auth/device-code/generate`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate device code");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Device code generation failed:", error);
      return null;
    }
  }

  async checkDeviceCodeStatus(
    code: string
  ): Promise<IDeviceCodeStatusResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/auth/device-code/status?code=${encodeURIComponent(
          code
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to check device code status");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Device code status check failed:", error);
      return null;
    }
  }

  async verifyToken(token: string): Promise<IAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Token verification failed:", error);
      return { success: false, error: "Network error" };
    }
  }

  saveToken(token: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  getToken(): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }

  clearToken(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }
}

export const authApi = new AuthApiService();
