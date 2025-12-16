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

  static _template(): Lightning.Component.Template {
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

      // Account Info (No grey box, minimal design)
      AccountCard: {
        x: 120,
        y: 280,
        w: 1680,
        h: 350,

        // Profile Icon
        ProfileIcon: {
          x: 0,
          y: 0,
          w: 90,
          h: 90,
          rect: true,
          color: Colors.profileAccent,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 45 },

          InitialText: {
            x: 45,
            y: 45,
            mount: 0.5,
            text: {
              text: "",
              fontSize: 42,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
              fontFace: FontFamily.Default,
            },
          },
        },

        // User Info
        UserInfo: {
          x: 120,
          y: 0,

          NameLabel: {
            x: 0,
            y: 0,
            text: {
              text: "Name",
              fontSize: 20,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          NameValue: {
            x: 0,
            y: 30,
            text: {
              text: "—",
              fontSize: 32,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },

          EmailLabel: {
            x: 0,
            y: 105,
            text: {
              text: "Email",
              fontSize: 20,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          EmailValue: {
            x: 0,
            y: 135,
            text: {
              text: "—",
              fontSize: 28,
              textColor: Colors.textSecondary,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Status and Member Info (horizontal layout)
        StatusRow: {
          x: 120,
          y: 195,

          StatusBadge: {
            x: 0,
            y: 0,
            w: 140,
            h: 40,
            rect: true,
            color: Colors.authAccent,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },

            StatusText: {
              x: 70,
              y: 20,
              mount: 0.5,
              text: {
                text: "● Active",
                fontSize: 20,
                fontStyle: FontStyle.Bold,
                textColor: Colors.white,
                fontFace: FontFamily.Default,
              },
            },
          },

          MemberInfo: {
            x: 180,
            y: 8,
            text: {
              text: "Member since —",
              fontSize: 20,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      // Divider
      Divider: {
        x: 120,
        y: 600,
        w: 1680,
        h: 1,
        rect: true,
        color: 0x20ffffff,
      },

      // Actions Section (minimal buttons)
      ActionsContainer: {
        x: 120,
        y: 660,
        w: 1680,

        BackButton: {
          x: 0,
          y: 0,
          w: 180,
          h: 60,

          Border: {
            x: 0,
            y: 0,
            w: 180,
            h: 60,
            rect: true,
            color: 0x00000000,
            alpha: 0,
            shader: {
              type: Lightning.shaders.RoundedRectangle,
              radius: 8,
              stroke: 3,
              strokeColor: Colors.authAccent,
            },
          },

          Label: {
            x: 90,
            y: 30,
            mount: 0.5,
            text: {
              text: "← Back",
              fontSize: 28,
              fontStyle: FontStyle.Bold,
              textColor: Colors.authAccent,
              fontFace: FontFamily.Default,
            },
          },
        },

        SignOutButton: {
          x: 220,
          y: 0,
          w: 200,
          h: 60,

          Border: {
            x: 0,
            y: 0,
            w: 200,
            h: 60,
            rect: true,
            color: 0x00000000,
            alpha: 0,
            shader: {
              type: Lightning.shaders.RoundedRectangle,
              radius: 8,
              stroke: 3,
              strokeColor: 0xffef4444,
            },
          },

          Label: {
            x: 100,
            y: 30,
            mount: 0.5,
            text: {
              text: "Sign Out",
              fontSize: 28,
              fontStyle: FontStyle.Bold,
              textColor: 0xffef4444,
              fontFace: FontFamily.Default,
            },
          },
        },
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

    // Update member date in StatusRow
    const statusRow = accountCard.tag("StatusRow");
    if (statusRow && this.user.created_at) {
      const memberInfo = statusRow.tag("MemberInfo");
      if (memberInfo && memberInfo.text) {
        const date = new Date(this.user.created_at);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        memberInfo.text.text = `Member since ${formattedDate}`;
      }
    }

    this.stage.update();
  }

  private _updateFocus(): void {
    const actionsContainer = this.tag("ActionsContainer");
    if (!actionsContainer) return;

    const backButton = actionsContainer.tag("BackButton");
    const signOutButton = actionsContainer.tag("SignOutButton");

    // Back button focus states
    if (backButton) {
      const backBorder = backButton.tag("Border");
      const backLabel = backButton.tag("Label");

      if (this.focusedButton === "back") {
        if (backBorder) {
          backBorder.alpha = 1;
        }
        if (backLabel && backLabel.text) {
          backLabel.text.textColor = Colors.white;
        }
      } else {
        if (backBorder) {
          backBorder.alpha = 0;
        }
        if (backLabel && backLabel.text) {
          backLabel.text.textColor = Colors.authAccent;
        }
      }
    }

    // Sign Out button focus states
    if (signOutButton) {
      const signOutBorder = signOutButton.tag("Border");
      const signOutLabel = signOutButton.tag("Label");

      if (this.focusedButton === "signout") {
        if (signOutBorder) {
          signOutBorder.alpha = 1;
        }
        if (signOutLabel && signOutLabel.text) {
          signOutLabel.text.textColor = Colors.white;
        }
      } else {
        if (signOutBorder) {
          signOutBorder.alpha = 0;
        }
        if (signOutLabel && signOutLabel.text) {
          signOutLabel.text.textColor = 0xffef4444;
        }
      }
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
      this.fireAncestors("$navigateToHome");
      return true;
    }

    if (this.focusedButton === "signout") {
      this._handleSignOut();
      return true;
    }

    return false;
  }

  _handleBack(): boolean {
    this.fireAncestors("$navigateToHome");
    return true;
  }

  private _handleSignOut(): void {
    console.log("🚪 Signing out...");
    // Clear stored token
    authApi.clearToken();
    this.fireAncestors("$signOut");
  }

  _init(): void {
    this._updateFocus();
  }

  _active(): void {
    this.focusedButton = "back";
    this._updateFocus();
  }
}
