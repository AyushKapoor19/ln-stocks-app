/**
 * SignIn Screen
 *
 * Two authentication methods:
 * 1. Use code (QR/Device code for mobile auth)
 * 2. Use email (Direct email/password login on TV)
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import { authApi } from "../services/authApi";
import type { IDeviceCodeResponse } from "../types/auth";

export default class SignIn extends BaseScreen {
  private selectedTabIndex = 0;
  private tabs = ["Use code", "Use email address"];
  private deviceCode: string = "";
  private pollInterval: NodeJS.Timeout | null = null;
  private qrImageUrl: string = "";

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

      GreenAccent: {
        x: 120,
        y: 115,
        w: 12,
        h: 70,
        rect: true,
        color: Colors.stockGreenBright,
      },

      Title: {
        x: 160,
        y: 100,
        text: {
          text: "Sign in. Stay invested.",
          fontSize: FontSize.XXLarge,
          fontStyle: FontStyle.Bold,
          textColor: Colors.textPrimary,
          fontFace: FontFamily.Default,
        },
      },

      TabContainer: {
        x: 120,
        y: 240,
        Tab_UseCode: {
          x: 0,
          y: 0,
          text: {
            text: "Use code",
            fontSize: FontSize.Body,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },
        Tab_UseCodeUnderline: {
          x: 0,
          y: 50,
          w: 150,
          h: 4,
          rect: true,
          color: Colors.textPrimary,
        },
        Tab_UseEmail: {
          x: 280,
          y: 0,
          text: {
            text: "Use email address",
            fontSize: FontSize.Body,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textSecondary,
            fontFace: FontFamily.Default,
          },
        },
        Tab_UseEmailUnderline: {
          x: 280,
          y: 50,
          w: 280,
          h: 4,
          rect: true,
          color: Colors.transparent,
        },
      },

      QRCodeContent: {
        x: 120,
        y: 340,
        w: 1680,
        h: 600,
        alpha: 1,

        LeftColumn: {
          x: 0,
          y: 0,
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
              text: "Or visit cnn.com/account/log-in/tv and confirm this code when prompted.",
              fontSize: FontSize.Body,
              textColor: Colors.textSecondary,
              fontFace: FontFamily.Default,
            },
          },

          DeviceCodeContainer: {
            y: 240,
            Code1: this._createCodeBox(0, "E"),
            Code2: this._createCodeBox(140, "Y"),
            Code3: this._createCodeBox(280, "4"),
            Code4: this._createCodeBox(420, "M"),
            Code5: this._createCodeBox(560, "Q"),
            Code6: this._createCodeBox(700, "5"),
            Code7: this._createCodeBox(840, "B"),
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
          x: 1240,
          y: 0,
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
      },
      EmailContent: {
        x: 120,
        y: 340,
        w: 1680,
        h: 600,
        alpha: 0,
        Text: {
          y: 50,
          text: {
            text: "Email/Password login - Coming soon...",
            fontSize: FontSize.Large,
            textColor: Colors.textSecondary,
            fontFace: FontFamily.Default,
          },
        },
      },
    };
  }

  private static _createCodeBox(xPos: number, defaultChar: string): object {
    return {
      x: xPos,
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
          text: defaultChar,
          fontSize: FontSize.XXLarge,
          fontStyle: FontStyle.Bold,
          textColor: Colors.textPrimary,
          fontFace: FontFamily.Default,
        },
      },
    };
  }

  async _init(): Promise<void> {
    super._init();
    this._updateContent();
    await this._generateDeviceCode();
  }

  _detach(): void {
    this._stopPolling();
  }

  _handleLeft(): boolean {
    if (this.selectedTabIndex === 1) {
      this.selectedTabIndex = 0;
      this._updateTabs();
      return true;
    }
    return false;
  }

  _handleRight(): boolean {
    if (this.selectedTabIndex === 0) {
      this.selectedTabIndex = 1;
      this._updateTabs();
      return true;
    }
    return false;
  }

  _handleEnter(): boolean {
    return false;
  }

  _handleBack(): boolean {
    console.log("📱 Navigating back to Home");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).fireAncestors("$navigateBack");
    return true;
  }

  $authenticationSuccess(data: { user: unknown; token: string }): void {
    console.log("✅ Authentication successful from child!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).fireAncestors("$authenticationSuccess", data);
  }

  private _updateTabs(): void {
    const tabContainer = this.tag("TabContainer");
    if (!tabContainer) return;

    const useCodeTab = tabContainer.tag("Tab_UseCode");
    const useCodeUnderline = tabContainer.tag("Tab_UseCodeUnderline");
    const useEmailTab = tabContainer.tag("Tab_UseEmail");
    const useEmailUnderline = tabContainer.tag("Tab_UseEmailUnderline");

    if (this.selectedTabIndex === 0) {
      if (useCodeTab && useCodeTab.text) {
        useCodeTab.text.textColor = Colors.textPrimary;
      }
      if (useCodeUnderline) {
        useCodeUnderline.setSmooth("alpha", 1, { duration: 0.2 });
      }
      if (useEmailTab && useEmailTab.text) {
        useEmailTab.text.textColor = Colors.textSecondary;
      }
      if (useEmailUnderline) {
        useEmailUnderline.setSmooth("alpha", 0, { duration: 0.2 });
      }
    } else {
      if (useCodeTab && useCodeTab.text) {
        useCodeTab.text.textColor = Colors.textSecondary;
      }
      if (useCodeUnderline) {
        useCodeUnderline.setSmooth("alpha", 0, { duration: 0.2 });
      }
      if (useEmailTab && useEmailTab.text) {
        useEmailTab.text.textColor = Colors.textPrimary;
      }
      if (useEmailUnderline) {
        useEmailUnderline.setSmooth("alpha", 1, { duration: 0.2 });
      }
    }

    this._updateContent();
    this.stage.update();
  }

  private _updateContent(): void {
    const qrCodeContent = this.tag("QRCodeContent");
    const emailContent = this.tag("EmailContent");

    if (this.selectedTabIndex === 0) {
      if (qrCodeContent) {
        qrCodeContent.setSmooth("alpha", 1, { duration: 0.3 });
      }
      if (emailContent) {
        emailContent.setSmooth("alpha", 0, { duration: 0.3 });
      }
    } else {
      if (qrCodeContent) {
        qrCodeContent.setSmooth("alpha", 0, { duration: 0.3 });
      }
      if (emailContent) {
        emailContent.setSmooth("alpha", 1, { duration: 0.3 });
      }
    }
  }

  private async _generateDeviceCode(): Promise<void> {
    console.log("🔄 Generating device code...");

    const response: IDeviceCodeResponse | null =
      await authApi.generateDeviceCode();

    if (!response) {
      console.error("❌ Failed to generate device code");
      return;
    }

    this.deviceCode = response.code;
    this.qrImageUrl = response.qrCodeDataUrl;

    this._displayDeviceCode(response.code);
    this._displayQRCode(response.qrCodeDataUrl);
    this._startPolling(response.pollInterval);

    console.log(`✅ Device code generated: ${response.code}`);
  }

  private _displayDeviceCode(code: string): void {
    const qrContent = this.tag("QRCodeContent");
    if (!qrContent) return;
    const leftColumn = qrContent.tag("LeftColumn");
    if (!leftColumn) return;
    const container = leftColumn.tag("DeviceCodeContainer");
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
    const qrContent = this.tag("QRCodeContent");
    if (!qrContent) return;
    const qrContainer = qrContent.tag("QRCodeContainer");
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

    console.log(`📡 Polling started (every ${interval}ms)`);
  }

  private _stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log("📡 Polling stopped");
    }
  }

  private async _checkCodeStatus(): Promise<void> {
    if (!this.deviceCode) return;

    const status = await authApi.checkDeviceCodeStatus(this.deviceCode);

    if (!status) return;

    if (status.status === "approved" && status.token && status.user) {
      console.log("✅ Authentication approved!");
      this._stopPolling();
      authApi.saveToken(status.token);
      this.$authenticationSuccess({ user: status.user, token: status.token });
    } else if (status.status === "expired") {
      console.log("⏰ Device code expired");
      this._stopPolling();
    }
  }
}
