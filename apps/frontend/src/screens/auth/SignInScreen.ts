/**
 * Sign In Screen
 * Two tabs: Mobile (QR Code) | Email Address
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "../BaseScreen";
import { Colors } from "../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../constants/Fonts";
import MobileAuthTab from "./components/MobileAuthTab";
import EmailSignInTab from "./components/EmailSignInTab";

type TabType = "mobile" | "email";

export default class SignInScreen extends BaseScreen {
  private currentTab: TabType = "mobile";
  private focusOnTab: boolean = true;

  static _template(): object {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: Colors.authBackground,

      // Header
      Header: {
        x: 120,
        y: 80,
        w: 1680,

        Title: {
          y: 0,
          text: {
            text: "Welcome Back",
            fontSize: 72,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          y: 100,
          text: {
            text: "Sign in to continue trading",
            fontSize: FontSize.Large,
            textColor: Colors.textTertiary,
            fontFace: FontFamily.Default,
          },
        },
      },

      // Tab Navigation
      TabBar: {
        x: 120,
        y: 260,
        w: 1680,
        h: 60,

        TabUnderline: {
          x: 0,
          y: 58,
          w: 1680,
          h: 2,
          rect: true,
          color: Colors.authBorderLight,
        },

        MobileTab: {
          x: 0,
          y: 0,

          Label: {
            x: 0,
            y: 20,
            text: {
              text: "Sign in using mobile",
              fontSize: FontSize.Large,
              textColor: Colors.authAccent,
              fontFace: FontFamily.Default,
            },
          },

          Indicator: {
            x: 0,
            y: 58,
            w: 260,
            h: 3,
            rect: true,
            color: Colors.authAccent,
          },
        },

        EmailTab: {
          x: 330,
          y: 0,

          Label: {
            x: 0,
            y: 20,
            text: {
              text: "Sign in using email address",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Indicator: {
            x: 0,
            y: 58,
            w: 360,
            h: 3,
            rect: true,
            color: Colors.authAccent,
            alpha: 0,
          },
        },
      },

      // Tab Content Container
      TabContent: {
        x: 120,
        y: 360,
        w: 1680,
        h: 640,

        MobileContent: {
          type: MobileAuthTab,
          alpha: 1,
          visible: true,
          authType: "signin",
        },

        EmailContent: {
          type: EmailSignInTab,
          alpha: 0,
          visible: false,
        },
      },
    };
  }

  _init(): void {
    super._init();
    this._updateTabIndicators();
    this._updateTabFocusIndicator();
  }

  _active(): void {
    // Reset to mobile tab and focus on tabs when screen becomes active
    this.currentTab = "mobile";
    this.focusOnTab = true;
    this._switchTab();
    this._updateTabFocusIndicator();
  }

  _getFocused(): Lightning.Component {
    if (this.focusOnTab) {
      return this;
    }

    const tabContent = this.tag("TabContent");
    if (!tabContent) return this;

    if (this.currentTab === "mobile") {
      const mobileContent = tabContent.tag("MobileContent");
      return (mobileContent as Lightning.Component) || this;
    } else {
      const emailContent = tabContent.tag("EmailContent");
      return (emailContent as Lightning.Component) || this;
    }
  }

  _handleLeft(): boolean {
    if (this.focusOnTab) {
      if (this.currentTab === "email") {
        this.currentTab = "mobile";
        this._switchTab();
        return true;
      }
      return false;
    }
    return false;
  }

  _handleRight(): boolean {
    if (this.focusOnTab) {
      if (this.currentTab === "mobile") {
        this.currentTab = "email";
        this._switchTab();
        return true;
      }
      return false;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.focusOnTab) {
      this.focusOnTab = false;
      this.stage.update();
      return true;
    }
    return false;
  }

  _handleUp(): boolean {
    if (!this.focusOnTab) {
      this.focusOnTab = true;
      this._clearFieldFocus();
      this._updateTabFocusIndicator();
      this.stage.update();
      return true;
    }
    return false;
  }

  _captureKey(event: KeyboardEvent): boolean {
    // Delegate keyboard capture to the active content component
    if (!this.focusOnTab) {
      const tabContent = this.tag("TabContent");
      if (tabContent) {
        const activeContent =
          this.currentTab === "mobile"
            ? tabContent.tag("MobileContent")
            : tabContent.tag("EmailContent");

        if (
          activeContent &&
          typeof (activeContent as any)._captureKey === "function"
        ) {
          return (activeContent as any)._captureKey(event);
        }
      }
    }
    return false;
  }

  _handleKey(event: KeyboardEvent): boolean {
    // Delegate keyboard events to the active content component
    if (!this.focusOnTab) {
      const tabContent = this.tag("TabContent");
      if (tabContent) {
        const activeContent =
          this.currentTab === "mobile"
            ? tabContent.tag("MobileContent")
            : tabContent.tag("EmailContent");

        if (
          activeContent &&
          typeof (activeContent as any)._handleKey === "function"
        ) {
          return (activeContent as any)._handleKey(event);
        }
      }
    }
    return false;
  }

  $focusBackToTab(): void {
    this.focusOnTab = true;
    this._clearFieldFocus();
    this._updateTabFocusIndicator();
    this.stage.update();
  }

  private _clearFieldFocus(): void {
    const tabContent = this.tag("TabContent");
    if (!tabContent) return;

    const emailContent = tabContent.tag("EmailContent");
    if (emailContent && (emailContent as any)._clearAllFocus) {
      (emailContent as any)._clearAllFocus();
    }
  }

  private _updateTabFocusIndicator(): void {
    const tabBar = this.tag("TabBar");
    if (!tabBar) return;

    const mobileTab = tabBar.tag("MobileTab");
    const emailTab = tabBar.tag("EmailTab");

    if (mobileTab) {
      const mobileLabel = mobileTab.tag("Label");
      if (mobileLabel && mobileLabel.text) {
        if (this.focusOnTab) {
          mobileLabel.text.textColor =
            this.currentTab === "mobile" ? 0xffffffff : Colors.textTertiary;
        } else {
          mobileLabel.text.textColor =
            this.currentTab === "mobile"
              ? Colors.authAccent
              : Colors.textTertiary;
        }
      }
    }

    if (emailTab) {
      const emailLabel = emailTab.tag("Label");
      if (emailLabel && emailLabel.text) {
        if (this.focusOnTab) {
          emailLabel.text.textColor =
            this.currentTab === "email" ? 0xffffffff : Colors.textTertiary;
        } else {
          emailLabel.text.textColor =
            this.currentTab === "email"
              ? Colors.authAccent
              : Colors.textTertiary;
        }
      }
    }
  }

  _handleBack(): boolean {
    if (!this.focusOnTab) {
      this.focusOnTab = true;
      this.stage.update();
      return true;
    }

    this.fireAncestors("$navigateBack");
    return true;
  }

  $navigateToSignUp(): void {
    this.fireAncestors("$navigateToSignUp");
  }

  $authSuccess(data: { user: unknown; token: string }): void {
    console.log("✅ Sign in successful");
    this.fireAncestors("$authSuccess", data);
  }

  private _switchTab(): void {
    const tabContent = this.tag("TabContent");
    if (!tabContent) return;

    const mobileContent = tabContent.tag("MobileContent");
    const emailContent = tabContent.tag("EmailContent");

    if (this.currentTab === "mobile") {
      if (mobileContent) {
        mobileContent.patch({ visible: true });
        mobileContent.setSmooth("alpha", 1, { duration: 0.3 });
      }
      if (emailContent) {
        emailContent.setSmooth("alpha", 0, { duration: 0.3 });
        setTimeout(() => {
          emailContent.patch({ visible: false });
        }, 300);
      }
    } else {
      if (emailContent) {
        emailContent.patch({ visible: true });
        emailContent.setSmooth("alpha", 1, { duration: 0.3 });
      }
      if (mobileContent) {
        mobileContent.setSmooth("alpha", 0, { duration: 0.3 });
        setTimeout(() => {
          mobileContent.patch({ visible: false });
        }, 300);
      }
    }

    this._updateTabIndicators();
    this._updateTabFocusIndicator();
  }

  private _updateTabIndicators(): void {
    const tabBar = this.tag("TabBar");
    if (!tabBar) return;

    const mobileTab = tabBar.tag("MobileTab");
    const emailTab = tabBar.tag("EmailTab");

    if (mobileTab) {
      const mobileLabel = mobileTab.tag("Label");
      const mobileIndicator = mobileTab.tag("Indicator");
      if (mobileLabel && mobileLabel.text) {
        mobileLabel.text.textColor =
          this.currentTab === "mobile"
            ? Colors.authAccent
            : Colors.textTertiary;
      }
      if (mobileIndicator) {
        mobileIndicator.setSmooth(
          "alpha",
          this.currentTab === "mobile" ? 1 : 0,
          {
            duration: 0.3,
          }
        );
      }
    }

    if (emailTab) {
      const emailLabel = emailTab.tag("Label");
      const emailIndicator = emailTab.tag("Indicator");
      if (emailLabel && emailLabel.text) {
        emailLabel.text.textColor =
          this.currentTab === "email" ? Colors.authAccent : Colors.textTertiary;
      }
      if (emailIndicator) {
        emailIndicator.setSmooth("alpha", this.currentTab === "email" ? 1 : 0, {
          duration: 0.3,
        });
      }
    }
  }
}
