/**
 * QR Code Screen
 *
 * Displays device code and QR code for mobile authentication
 * Polls backend until user approves on mobile
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import { authApi } from "../services/authApi";
import type { IDeviceCodeResponse } from "../types/auth";

export default class QRCodeScreen extends BaseScreen {
  private deviceCode: string = "";
  private pollInterval: NodeJS.Timeout | null = null;

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

      LeftColumn: {
        x: 120,
        y: 100,
        w: 1000,

        Title: {
          y: 0,
          text: {
            text: "Scan the QR code with your mobile device.",
            fontSize: FontSize.XLarge,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          y: 100,
          w: 900,
          text: {
            text: "Scan the QR code with your mobile device to sign in.",
            fontSize: FontSize.Body,
            textColor: Colors.textSecondary,
            fontFace: FontFamily.Default,
          },
        },

        DeviceCodeContainer: {
          y: 240,
          Code1: {
            x: 0,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "E",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
          Code2: {
            x: 140,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "Y",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
          Code3: {
            x: 280,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "4",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
          Code4: {
            x: 420,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "M",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
          Code5: {
            x: 560,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "Q",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
          Code6: {
            x: 700,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "5",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
          Code7: {
            x: 840,
            y: 0,
            w: 120,
            h: 160,
            rect: true,
            color: Colors.cardBackground,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            Label: {
              x: 60,
              y: 80,
              mount: 0.5,
              text: {
                text: "B",
                fontSize: FontSize.XXLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },
          },
        },

        GetNewCodeButton: {
          y: 460,
          w: 400,
          h: 80,
          rect: true,
          color: Colors.transparent,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },
          Border: {
            w: 400,
            h: 80,
            rect: true,
            color: Colors.border,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },
          },
          Label: {
            x: 200,
            y: 40,
            mount: 0.5,
            text: {
              text: "🔄  Get new code",
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      QRCodeContainer: {
        x: 1360,
        y: 320,
        w: 480,
        h: 480,
        rect: true,
        color: Colors.white,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },
        QRImage: {
          x: 40,
          y: 40,
          w: 400,
          h: 400,
        },
      },
    };
  }

  async _init(): Promise<void> {
    super._init();
    await this._generateDeviceCode();
  }

  _detach(): void {
    this._stopPolling();
  }

  _handleBack(): boolean {
    this._stopPolling();
    this.signal("$navigateBack");
    return true;
  }

  private async _generateDeviceCode(): Promise<void> {
    const response: IDeviceCodeResponse | null =
      await authApi.generateDeviceCode();

    if (!response) {
      return;
    }

    this.deviceCode = response.code;

    this._displayDeviceCode(response.code);
    this._displayQRCode(response.qrCodeDataUrl);
    this._startPolling(response.pollInterval);
  }

  private _displayDeviceCode(code: string): void {
    const container = this.tag("LeftColumn").tag("DeviceCodeContainer");
    if (!container) return;

    for (let i = 0; i < 7; i++) {
      const codeBox = container.tag(`Code${i + 1}`);
      if (codeBox) {
        const label = codeBox.tag("Label");
        if (label && label.text) {
          label.text.text = code[i] || "";
        }
      }
    }

    this.stage.update();
  }

  private _displayQRCode(dataUrl: string): void {
    const qrContainer = this.tag("QRCodeContainer");
    if (!qrContainer) return;

    const qrImage = qrContainer.tag("QRImage");
    if (qrImage) {
      qrImage.patch({
        texture: { type: Lightning.textures.ImageTexture, src: dataUrl },
      });
    }

    this.stage.update();
  }

  private _startPolling(interval: number): void {
    this._stopPolling();

    this.pollInterval = setInterval(async () => {
      await this._checkCodeStatus();
    }, interval);
  }

  private _stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async _checkCodeStatus(): Promise<void> {
    if (!this.deviceCode) return;

    const status = await authApi.checkDeviceCodeStatus(this.deviceCode);

    if (!status) return;

    if (status.status === "approved" && status.token && status.user) {
      this._stopPolling();
      authApi.saveToken(status.token);
      this.signal("$authenticationSuccess", {
        user: status.user,
        token: status.token,
      });
    } else if (status.status === "expired") {
      this._stopPolling();
    }
  }
}
