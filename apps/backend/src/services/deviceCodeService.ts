/**
 * Device Code Service
 *
 * Handles device code generation for TV authentication via mobile/QR code
 */

import QRCode from "qrcode";
import { pool } from "../utils/db.js";
import {
  DEVICE_CODE_LENGTH,
  DEVICE_CODE_EXPIRES_IN,
  DEVICE_CODE_POLL_INTERVAL,
} from "../constants/config.js";
import { queryOne, executeCommand, queryMany } from "../utils/serviceHelpers.js";
import type {
  IDeviceCode,
  IDeviceCodeResponse,
  IDeviceCodeStatusResponse,
} from "../types/auth.js";
import { authService } from "./authService.js";

class DeviceCodeService {
  async generateDeviceCode(
    authType: "signin" | "signup" = "signin",
  ): Promise<IDeviceCodeResponse> {
    const code = this.generateRandomCode(DEVICE_CODE_LENGTH);
    const expiresAt = new Date(Date.now() + DEVICE_CODE_EXPIRES_IN);

    try {
      await pool.query(
        "INSERT INTO device_codes (code, status, auth_type, expires_at) VALUES ($1, $2, $3, $4::timestamptz)",
        [code, "pending", authType, expiresAt.toISOString()],
      );

      const mobileWebUrl =
        process.env.MOBILE_WEB_URL || "http://localhost:3001";
      const authUrl = `${mobileWebUrl}/activate?code=${code}`;
      const qrCodeDataUrl = await QRCode.toDataURL(authUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      return {
        code,
        qrCodeDataUrl,
        expiresAt,
        pollInterval: DEVICE_CODE_POLL_INTERVAL,
      };
    } catch (error) {
      throw new Error("Failed to generate device code");
    }
  }

  async checkDeviceCodeStatus(
    code: string,
  ): Promise<IDeviceCodeStatusResponse> {
    try {
      const deviceCode = await queryOne<IDeviceCode>(
        pool,
        "SELECT * FROM device_codes WHERE code = $1",
        [code],
      );

      if (!deviceCode) {
        return { status: "expired" };
      }

      if (new Date() > new Date(deviceCode.expires_at)) {
        await this.markDeviceCodeExpired(code);
        return { status: "expired" };
      }

      if (deviceCode.status === "approved" && deviceCode.user_id) {
        const user = await authService.findUserById(deviceCode.user_id);
        if (user) {
          const token = authService.generateToken(user);
          await this.markDeviceCodeUsed(code);

          return {
            status: "approved",
            token,
            user,
          };
        }
      }

      return { status: deviceCode.status };
    } catch (error) {
      return { status: "expired" };
    }
  }

  async approveDeviceCode(code: string, userId: number): Promise<boolean> {
    const result = await queryMany<IDeviceCode>(
      pool,
      "UPDATE device_codes SET status = $1, user_id = $2 WHERE code = $3 AND status = $4 AND expires_at > NOW() RETURNING *",
      ["approved", userId, code, "pending"],
    );

    return result.length > 0;
  }

  async markDeviceCodeExpired(code: string): Promise<void> {
    await executeCommand(
      pool,
      "UPDATE device_codes SET status = $1 WHERE code = $2",
      ["expired", code],
    );
  }

  async markDeviceCodeUsed(code: string): Promise<void> {
    await executeCommand(
      pool,
      "UPDATE device_codes SET used_at = CURRENT_TIMESTAMP WHERE code = $1",
      [code],
    );
  }

  async cleanupExpiredCodes(): Promise<void> {
    await executeCommand(
      pool,
      "DELETE FROM device_codes WHERE expires_at < NOW()",
    );
  }

  private generateRandomCode(length: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }

    return code;
  }
}

export const deviceCodeService = new DeviceCodeService();

setInterval(
  () => {
    deviceCodeService.cleanupExpiredCodes();
  },
  5 * 60 * 1000,
);
