/**
 * Auth Service
 *
 * Handles authentication-related API calls
 */

import { apiService } from "./apiService";
import type {
  ISignUpData,
  IDeviceCodeVerifyResponse,
  IDeviceCodeApprovalResponse,
} from "../types/auth";

class AuthService {
  private handleError(error: unknown, defaultMessage: string): string {
    return error instanceof Error ? error.message : defaultMessage;
  }

  async verifyDeviceCode(code: string): Promise<IDeviceCodeVerifyResponse> {
    try {
      return await apiService.post<IDeviceCodeVerifyResponse>(
        "/auth/device-code/verify",
        { code },
      );
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, "Failed to verify code"),
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
        error: this.handleError(error, "Failed to approve device"),
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
        error: this.handleError(error, "Failed to approve device"),
      };
    }
  }
}

export const authService = new AuthService();
