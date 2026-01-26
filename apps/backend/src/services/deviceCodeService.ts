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
      const result = await pool.query<IDeviceCode>(
        "SELECT * FROM device_codes WHERE code = $1",
        [code],
      );

      if (result.rows.length === 0) {
        return { status: "expired" };
      }

      const deviceCode = result.rows[0];

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
    try {
      const result = await pool.query(
        "UPDATE device_codes SET status = $1, user_id = $2 WHERE code = $3 AND status = $4 AND expires_at > NOW() RETURNING *",
        ["approved", userId, code, "pending"],
      );

      if (result.rows.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async markDeviceCodeExpired(code: string): Promise<void> {
    try {
      await pool.query("UPDATE device_codes SET status = $1 WHERE code = $2", [
        "expired",
        code,
      ]);
    } catch (error) {}
  }

  async markDeviceCodeUsed(code: string): Promise<void> {
    try {
      await pool.query(
        "UPDATE device_codes SET used_at = CURRENT_TIMESTAMP WHERE code = $1",
        [code],
      );
    } catch (error) {}
  }

  async cleanupExpiredCodes(): Promise<void> {
    try {
      const result = await pool.query(
        "DELETE FROM device_codes WHERE expires_at < NOW()",
      );

      if (result.rowCount && result.rowCount > 0) {
      }
    } catch (error) {}
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
