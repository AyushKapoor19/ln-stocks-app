/**
 * Account Screen
 * Displays user account information after successful authentication
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../constants/Fonts";
import BaseScreen from "../BaseScreen";
import { authApi } from "../../services/authApi";

interface IUser {
  id: number;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export default class AccountScreen extends BaseScreen {
  private user: IUser | null = null;
  private focusedButton: "signout" | "back" = "back";

  static _template(): Lightning.Component.Template<object> {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: Colors.black,

      // Header Section
      Header: {
        x: 120,
        y: 80,
        w: 1680,
        h: 120,

        Title: {
          x: 0,
          y: 0,
          text: {
            text: "Account",
            fontSize: 64,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          x: 0,
          y: 85,
          text: {
            text: "Manage your trading profile",
            fontSize: 28,
            textColor: Colors.textSecondary,
            fontFace: FontFamily.Default,
          },
        },

        Divider: {
          x: 0,
          y: 140,
          w: 1680,
          h: 2,
          rect: true,
          color: 0x20ffffff,
        },
      },

      // Account Info Card
      AccountCard: {
        x: 120,
        y: 260,
        w: 1680,
        h: 400,

        Background: {
          x: 0,
          y: 0,
          w: 1680,
          h: 400,
          rect: true,
          color: 0x15ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },
        },

        Border: {
          x: -2,
          y: -2,
          w: 1684,
          h: 404,
          rect: true,
          color: 0x25ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 22 },
          zIndex: -1,
        },

        // Profile Icon
        ProfileIcon: {
          x: 60,
          y: 60,
          w: 120,
          h: 120,
          rect: true,
          color: Colors.authAccent,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 60 },

          InitialText: {
            x: 60,
            y: 60,
            mount: 0.5,
            text: {
              text: "",
              fontSize: 56,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        // User Info
        UserInfo: {
          x: 220,
          y: 60,

          NameLabel: {
            x: 0,
            y: 0,
            text: {
              text: "Name",
              fontSize: 22,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          NameValue: {
            x: 0,
            y: 35,
            text: {
              text: "—",
              fontSize: 38,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },

          EmailLabel: {
            x: 0,
            y: 100,
            text: {
              text: "Email",
              fontSize: 22,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          EmailValue: {
            x: 0,
            y: 135,
            text: {
              text: "—",
              fontSize: 32,
              textColor: Colors.textSecondary,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Status Badge
        StatusBadge: {
          x: 60,
          y: 250,
          w: 180,
          h: 50,
          rect: true,
          color: Colors.authAccent,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 25 },

          StatusText: {
            x: 90,
            y: 25,
            mount: 0.5,
            text: {
              text: "Active",
              fontSize: 24,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },

          StatusIcon: {
            x: 40,
            y: 25,
            mount: 0.5,
            text: {
              text: "●",
              fontSize: 20,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Member Since
        MemberSince: {
          x: 280,
          y: 265,
          text: {
            text: "Member since",
            fontSize: 20,
            textColor: Colors.textQuaternary,
            fontFace: FontFamily.Default,
          },
        },

        MemberDate: {
          x: 450,
          y: 265,
          text: {
            text: "—",
            fontSize: 20,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textSecondary,
            fontFace: FontFamily.Default,
          },
        },
      },

      // Actions Section
      ActionsContainer: {
        x: 120,
        y: 720,
        w: 1680,

        BackButton: {
          x: 0,
          y: 0,
          w: 280,
          h: 80,
          rect: true,
          color: 0x20ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

          Label: {
            x: 140,
            y: 40,
            mount: 0.5,
            text: {
              text: "← Back",
              fontSize: 28,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },

        SignOutButton: {
          x: 320,
          y: 0,
          w: 280,
          h: 80,
          rect: true,
          color: 0x20ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

          Label: {
            x: 140,
            y: 40,
            mount: 0.5,
            text: {
              text: "Sign Out",
              fontSize: 28,
              fontStyle: FontStyle.Bold,
              textColor: 0xffff4444,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      // Decorative Elements
      AccentLine1: {
        x: 120,
        y: 680,
        w: 800,
        h: 2,
        rect: true,
        color: Colors.authAccent,
        alpha: 0.3,
      },

      AccentLine2: {
        x: 1000,
        y: 680,
        w: 800,
        h: 2,
        rect: true,
        color: Colors.authAccent,
        alpha: 0.3,
      },
    };
  }

  setUser(user: IUser): void {
    this.user = user;
    this._updateUserDisplay();
  }

  private _updateUserDisplay(): void {
    if (!this.user) return;

    const accountCard = this.tag("AccountCard");
    if (!accountCard) return;

    // Update profile initial
    const profileIcon = accountCard.tag("ProfileIcon");
    if (profileIcon) {
      const initialText = profileIcon.tag("InitialText");
      if (initialText && initialText.text) {
        const initial = this.user.display_name
          ? this.user.display_name.charAt(0).toUpperCase()
          : this.user.email.charAt(0).toUpperCase();
        initialText.text.text = initial;
      }
    }

    // Update user info
    const userInfo = accountCard.tag("UserInfo");
    if (userInfo) {
      const nameValue = userInfo.tag("NameValue");
      if (nameValue && nameValue.text) {
        nameValue.text.text = this.user.display_name || "User";
      }

      const emailValue = userInfo.tag("EmailValue");
      if (emailValue && emailValue.text) {
        emailValue.text.text = this.user.email;
      }
    }

    // Update member date
    const memberDate = accountCard.tag("MemberDate");
    if (memberDate && memberDate.text && this.user.created_at) {
      const date = new Date(this.user.created_at);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      memberDate.text.text = formattedDate;
    }

    this.stage.update();
  }

  private _updateFocus(): void {
    const actionsContainer = this.tag("ActionsContainer");
    if (!actionsContainer) return;

    const backButton = actionsContainer.tag("BackButton");
    const signOutButton = actionsContainer.tag("SignOutButton");

    if (backButton) {
      backButton.patch({
        color: this.focusedButton === "back" ? Colors.authAccent : 0x20ffffff,
      });
    }

    if (signOutButton) {
      signOutButton.patch({
        color: this.focusedButton === "signout" ? 0xff553333 : 0x20ffffff,
      });
    }
  }

  _handleLeft(): boolean {
    if (this.focusedButton === "signout") {
      this.focusedButton = "back";
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleRight(): boolean {
    if (this.focusedButton === "back") {
      this.focusedButton = "signout";
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleEnter(): boolean {
    if (this.focusedButton === "back") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).fireAncestors("$navigateToHome");
      return true;
    }

    if (this.focusedButton === "signout") {
      this._handleSignOut();
      return true;
    }

    return false;
  }

  _handleBack(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).fireAncestors("$navigateToHome");
    return true;
  }

  private _handleSignOut(): void {
    console.log("🚪 Signing out...");
    // Clear stored token
    authApi.clearToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).fireAncestors("$signOut");
  }

  _init(): void {
    this._updateFocus();
  }

  _active(): void {
    this.focusedButton = "back";
    this._updateFocus();
  }
}
