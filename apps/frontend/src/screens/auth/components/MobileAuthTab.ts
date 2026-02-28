/**
 * Mobile Authentication Tab
 * Displays QR code and device code for mobile sign in/up
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../../constants/Fonts";
import { authApi } from "../../../services/authApi";

interface IMobileAuthTabProps {
  authType: "signup" | "signin";
}

export default class MobileAuthTab extends Lightning.Component {
  private deviceCode: string = "";
  private qrCodeUrl: string = "";
  private authType: "signup" | "signin" = "signup";
  private isFocused: boolean = false;
  private expiryTimer: NodeJS.Timeout | null = null;
  private codeExpiresIn: number = 15 * 60 * 1000; // 15 minutes

  static _template(): object {
    return {
      w: 1680,
      h: 640,

      LeftSection: {
        x: 0,
        y: 0,
        w: 840,
        h: 640,

        Instructions: {
          x: 0,
          y: 40,
          w: 700,
          text: {
            text: "",
            fontSize: FontSize.Large,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
            lineHeight: 48,
            wordWrap: true,
            wordWrapWidth: 700,
          },
        },

        DeviceCodeLabel: {
          x: 0,
          y: 180,
          text: {
            text: "Or enter this code on your mobile device:",
            fontSize: FontSize.Body,
            textColor: Colors.textSecondary,
            fontFace: FontFamily.Default,
          },
        },

        DeviceCodeContainer: {
          x: 0,
          y: 240,
          w: 480,
          h: 120,
          rect: true,
          color: Colors.authAccent,
          alpha: 0.7,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: 16,
          },

          CodeText: {
            x: 240,
            y: 60,
            mount: 0.5,
            text: {
              text: "Loading...",
              fontSize: 56,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
              letterSpacing: 8,
            },
          },
        },

        URLText: {
          x: 0,
          y: 400,
          w: 700,
          text: {
            text: "Visit ln-stocks-web.vercel.app/activate",
            fontSize: FontSize.Body,
            textColor: Colors.textTertiary,
            fontFace: FontFamily.Default,
          },
        },
      },

      RightSection: {
        x: 900,
        y: 0,
        w: 780,
        h: 640,

        QRCodeCard: {
          x: 327,
          y: 40,
          w: 450,
          h: 450,

          QRCodeImage: {
            x: 0,
            y: 0,
            w: 450,
            h: 450,
            src: "",
          },
        },
      },
    };
  }

  set params(value: IMobileAuthTabProps) {
    this.authType = value.authType;
  }

  _init(): void {
    this._updateInstructions();
    void this._loadDeviceCode();
  }

  _active(): void {
    if (!this.deviceCode) {
      void this._loadDeviceCode();
    }
  }

  _detach(): void {
    // Clear timer when component is removed
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    // Clear device code data
    this.deviceCode = "";
    this.qrCodeUrl = "";
  }

  _focus(): void {
    this.isFocused = true;
    this._updateDeviceCodeStyle();
  }

  _unfocus(): void {
    this.isFocused = false;
    this._updateDeviceCodeStyle();
  }

  _getFocused(): Lightning.Component {
    return this;
  }

  _handleUp(): boolean {
    this.fireAncestors("$focusBackToTab");
    return true;
  }

  _handleBack(): boolean {
    this.fireAncestors("$focusBackToTab");
    return true;
  }

  private _updateDeviceCodeStyle(): void {
    const deviceCodeContainer = this.tag("LeftSection")?.tag(
      "DeviceCodeContainer",
    );
    if (deviceCodeContainer) {
      deviceCodeContainer.patch({
        color: this.isFocused ? Colors.authAccentLight : Colors.authAccent,
        alpha: this.isFocused ? 1 : 0.7,
      });
    }
  }

  private _updateInstructions(): void {
    const instructions = this.tag("LeftSection")?.tag("Instructions");
    if (instructions && instructions.text) {
      if (this.authType === "signup") {
        instructions.text.text =
          "Scan the QR code with your mobile device to create your account instantly.";
      } else {
        instructions.text.text =
          "Scan the QR code with your mobile device to sign in instantly.";
      }
    }
  }

  private async _loadDeviceCode(): Promise<void> {
    // Fade out animation
    await this._fadeOutCode();

    const response = await authApi.generateDeviceCode(this.authType);
    
    if (!response || !response.code || !response.qrCodeDataUrl) {
      console.error("Failed to load device code");
      const codeText = this.tag("LeftSection")?.tag("DeviceCodeContainer")?.tag("CodeText");
      if (codeText && codeText.text) {
        codeText.text.text = "ERROR";
      }
      return;
    }

    this.deviceCode = response.code;
    this.qrCodeUrl = response.qrCodeDataUrl;

    const codeText = this.tag("LeftSection")
      ?.tag("DeviceCodeContainer")
      ?.tag("CodeText");
    if (codeText && codeText.text) {
      codeText.text.text = this.deviceCode;
    }

    const qrImage = this.tag("RightSection")
      ?.tag("QRCodeCard")
      ?.tag("QRCodeImage");
    if (qrImage) {
      qrImage.patch({ src: this.qrCodeUrl });
    }

    // Fade in animation
    await this._fadeInCode();

    this._updateDeviceCodeStyle();
    this.stage.update();

    // Set up auto-refresh timer
    this._setupExpiryTimer();

    void this._pollDeviceCodeStatus();
  }

  private async _fadeOutCode(): Promise<void> {
    const deviceCodeContainer = this.tag("LeftSection")?.tag(
      "DeviceCodeContainer",
    );
    const qrCodeCard = this.tag("RightSection")?.tag("QRCodeCard");

    return new Promise((resolve) => {
      if (deviceCodeContainer) {
        deviceCodeContainer.setSmooth("alpha", 0.2, { duration: 0.4 });
      }
      if (qrCodeCard) {
        qrCodeCard.setSmooth("alpha", 0.2, { duration: 0.4 });
      }
      setTimeout(resolve, 400);
    });
  }

  private async _fadeInCode(): Promise<void> {
    const deviceCodeContainer = this.tag("LeftSection")?.tag(
      "DeviceCodeContainer",
    );
    const qrCodeCard = this.tag("RightSection")?.tag("QRCodeCard");

    return new Promise((resolve) => {
      if (deviceCodeContainer) {
        deviceCodeContainer.setSmooth("alpha", 1, { duration: 0.6 });
      }
      if (qrCodeCard) {
        qrCodeCard.setSmooth("alpha", 1, { duration: 0.6 });
      }
      setTimeout(resolve, 600);
    });
  }

  private _setupExpiryTimer(): void {
    // Clear existing timer
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
    }

    // Set timer to auto-refresh code before expiry
    this.expiryTimer = setTimeout(() => {
      void this._loadDeviceCode();
    }, this.codeExpiresIn);
  }

  private async _pollDeviceCodeStatus(): Promise<void> {
    const checkStatus = async (): Promise<void> => {
      if (!this.deviceCode) return;

      const response = await authApi.checkDeviceCodeStatus(this.deviceCode);
      if (!response) return;

      if (response.status === "approved" && response.token && response.user) {
        this.fireAncestors("$authSuccess", {
          user: response.user,
          token: response.token,
        });
        return;
      }

      if (response.status === "pending") {
        setTimeout(checkStatus, 3000);
      }
    };

    setTimeout(checkStatus, 3000);
  }
}
