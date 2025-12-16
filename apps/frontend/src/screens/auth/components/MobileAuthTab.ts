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
          y: 0,
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
          color: Colors.authInputBackground,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },

          CodeText: {
            x: 240,
            y: 60,
            mount: 0.5,
            text: {
              text: "Loading...",
              fontSize: 56,
              fontStyle: FontStyle.Bold,
              textColor: Colors.authAccentLight,
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
            text: "Visit stocks.app/activate on your mobile device",
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
          x: 140,
          y: 80,
          w: 500,
          h: 500,
          rect: true,
          color: Colors.authCardBackground,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },

          Shadow: {
            x: -8,
            y: -8,
            w: 516,
            h: 516,
            rect: true,
            color: Colors.shadow,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },
            zIndex: -1,
          },

          QRCodeImage: {
            x: 50,
            y: 50,
            w: 400,
            h: 400,
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
    console.log("📱 Loading device code...");

    const response = await authApi.generateDeviceCode();
    if (!response) {
      console.error("❌ Failed to load device code");
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

    this.stage.update();
    void this._pollDeviceCodeStatus();
  }

  private async _pollDeviceCodeStatus(): Promise<void> {
    const checkStatus = async (): Promise<void> => {
      if (!this.deviceCode) return;

      const response = await authApi.checkDeviceCodeStatus(this.deviceCode);
      if (!response) return;

      if (response.status === "approved" && response.token && response.user) {
        console.log("✅ Device code approved!");
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

  _detach(): void {
    this.deviceCode = "";
    this.qrCodeUrl = "";
  }
}
