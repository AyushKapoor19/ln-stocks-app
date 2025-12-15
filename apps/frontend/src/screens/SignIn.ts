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

export default class SignIn extends BaseScreen {
  private selectedTabIndex = 0;
  private tabs = ["Use code", "Use email address"];

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

      Title: {
        x: 120,
        y: 100,
        text: {
          text: "Sign in to your CNN account",
          fontSize: FontSize.XXLarge,
          fontStyle: FontStyle.Bold,
          textColor: Colors.textPrimary,
          fontFace: FontFamily.Default,
        },
      },

      RedAccent: {
        x: 120,
        y: 90,
        w: 8,
        h: 100,
        rect: true,
        color: Colors.stockRed,
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

      ContentContainer: {
        x: 120,
        y: 340,
        w: 1680,
        h: 600,
      },
    };
  }

  _init(): void {
    super._init();
    this._showTabContent();
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
    this._showTabContent();
    return true;
  }

  _handleBack(): boolean {
    this.signal("$navigateBack");
    return true;
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

    this._showTabContent();
    this.stage.update();
  }

  private _showTabContent(): void {
    if (this.selectedTabIndex === 0) {
      console.log("🔍 Navigating to QR Code screen");
      this.signal("$showQRCodeScreen");
    } else {
      console.log("📧 Navigating to Email Login screen");
      this.signal("$showEmailLoginScreen");
    }
  }
}
