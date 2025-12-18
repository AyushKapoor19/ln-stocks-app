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

        Title: {
          y: 0,
          text: {
            text: "Account",
            fontSize: 72,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          y: 100,
          text: {
            text: "Manage your trading profile",
            fontSize: FontSize.Large,
            textColor: Colors.textTertiary,
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

      // Account Info (Simple list, no cards)
      AccountCard: {
        x: 120,
        y: 280,
        w: 1680,
        h: 260,

        // Name Row
        NameRow: {
          x: 0,
          y: 0,

          Label: {
            x: 0,
            y: 0,
            text: {
              text: "Name",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Value: {
            x: 400,
            y: 0,
            text: {
              text: "—",
              fontSize: FontSize.Large,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Email Row
        EmailRow: {
          x: 0,
          y: 70,

          Label: {
            x: 0,
            y: 0,
            text: {
              text: "Email",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Value: {
            x: 400,
            y: 0,
            text: {
              text: "—",
              fontSize: FontSize.Large,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Status Row
        StatusRow: {
          x: 0,
          y: 140,

          Label: {
            x: 0,
            y: 0,
            text: {
              text: "Status",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Value: {
            x: 400,
            y: 0,
            text: {
              text: "Active",
              fontSize: FontSize.Large,
              textColor: Colors.authAccent,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Member Since Row
        MemberRow: {
          x: 0,
          y: 210,

          Label: {
            x: 0,
            y: 0,
            text: {
              text: "Member since",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Value: {
            x: 400,
            y: 0,
            text: {
              text: "—",
              fontSize: FontSize.Large,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      // Divider
      Divider: {
        x: 120,
        y: 580,
        w: 1680,
        h: 1,
        rect: true,
        color: 0x20ffffff,
      },

      // Actions Section (minimal buttons)
      ActionsContainer: {
        x: 120,
        y: 640,
        w: 1680,

        BackButton: {
          x: 0,
          y: 0,

          Label: {
            x: 0,
            y: 0,
            text: {
              text: "← Back",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Indicator: {
            x: 0,
            y: 38,
            w: 98,
            h: 3,
            rect: true,
            color: Colors.authAccent,
            alpha: 0,
          },
        },

        SignOutButton: {
          x: 180,
          y: 0,

          Label: {
            x: 0,
            y: 0,
            text: {
              text: "Sign Out →",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Indicator: {
            x: 0,
            y: 38,
            w: 145,
            h: 3,
            rect: true,
            color: 0xffef4444,
            alpha: 0,
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

    // Update name
    const nameRow = accountCard.tag("NameRow");
    if (nameRow) {
      const nameValue = nameRow.tag("Value");
      if (nameValue && nameValue.text) {
        nameValue.text.text = this.user.display_name || "—";
      }
    }

    // Update email
    const emailRow = accountCard.tag("EmailRow");
    if (emailRow) {
      const emailValue = emailRow.tag("Value");
      if (emailValue && emailValue.text) {
        emailValue.text.text = this.user.email;
      }
    }

    // Update member since
    const memberRow = accountCard.tag("MemberRow");
    if (memberRow) {
      const memberValue = memberRow.tag("Value");
      if (memberValue && memberValue.text && this.user.created_at) {
        const date = new Date(this.user.created_at);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        memberValue.text.text = formattedDate;
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
      const backLabel = backButton.tag("Label");
      const backIndicator = backButton.tag("Indicator");

      if (this.focusedButton === "back") {
        if (backLabel && backLabel.text) {
          backLabel.text.textColor = Colors.white;
        }
        if (backIndicator) {
          backIndicator.setSmooth("alpha", 1, { duration: 0.3 });
        }
      } else {
        if (backLabel && backLabel.text) {
          backLabel.text.textColor = Colors.textTertiary;
        }
        if (backIndicator) {
          backIndicator.setSmooth("alpha", 0, { duration: 0.3 });
        }
      }
    }

    // Sign Out button focus states
    if (signOutButton) {
      const signOutLabel = signOutButton.tag("Label");
      const signOutIndicator = signOutButton.tag("Indicator");

      if (this.focusedButton === "signout") {
        if (signOutLabel && signOutLabel.text) {
          signOutLabel.text.textColor = Colors.white;
        }
        if (signOutIndicator) {
          signOutIndicator.setSmooth("alpha", 1, { duration: 0.3 });
        }
      } else {
        if (signOutLabel && signOutLabel.text) {
          signOutLabel.text.textColor = Colors.textTertiary;
        }
        if (signOutIndicator) {
          signOutIndicator.setSmooth("alpha", 0, { duration: 0.3 });
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
