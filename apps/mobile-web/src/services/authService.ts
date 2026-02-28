/**
 * Auth Service
 *
 * Handles authentication-related API calls
 */

import { apiService } from "./apiService";
import type {
  ISignUpData,
  ISignInData,
  IAuthResponse,
  IDeviceCodeVerifyResponse,
  IDeviceCodeApprovalResponse,
} from "../types/auth";

class AuthService {
  async verifyDeviceCode(code: string): Promise<IDeviceCodeVerifyResponse> {
    try {
      return await apiService.post<IDeviceCodeVerifyResponse>(
        "/auth/device-code/verify",
        { code },
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify code",
      };
    }
  }

  async signUp(data: ISignUpData): Promise<IAuthResponse> {
    try {
      return await apiService.post<IAuthResponse>("/auth/signup", data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign up",
      };
    }
  }

  async signIn(data: ISignInData): Promise<IAuthResponse> {
    try {
      return await apiService.post<IAuthResponse>("/auth/login", data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign in",
      };
    }
  }

  async approveDeviceCode(
    code: string,
    email: string,
    password: string,
  ): Promise<IDeviceCodeApprovalResponse> {
    try {
      return await apiService.post<IDeviceCodeApprovalResponse>(
        "/auth/device-code/approve",
        { code, email, password },
      );
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve device",
      };
    }
  }

  async approveDeviceCodeWithSignUp(
    code: string,
    signUpData: ISignUpData,
  ): Promise<IDeviceCodeApprovalResponse> {
    try {
      return await apiService.post<IDeviceCodeApprovalResponse>(
        "/auth/device-code/approve-signup",
        {
          code,
          displayName: signUpData.displayName,
          email: signUpData.email,
          password: signUpData.password,
        },
      );
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve device",
      };
    }
  }
}

export const authService = new AuthService();
