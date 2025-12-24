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
        y: 60,
        w: 1680,

        Title: {
          y: 0,
          text: {
            text: "Account Overview",
            fontSize: 64,
            fontStyle: FontStyle.Bold,
            textColor: 0xffffffff,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          y: 85,
          text: {
            text: "Manage your trading profile and account settings",
            fontSize: 26,
            textColor: 0xff888888,
            fontFace: FontFamily.Default,
          },
        },

        Divider: {
          y: 145,
          w: 1680,
          h: 2,
          rect: true,
          color: 0x33ffffff,
        },
      },

      // Personal Information Section
      PersonalInfoSection: {
        x: 120,
        y: 230,
        w: 1680,

        SectionTitle: {
          y: 0,
          text: {
            text: "PERSONAL INFORMATION",
            fontSize: 20,
            fontStyle: FontStyle.Bold,
            textColor: 0xff666666,
            letterSpacing: 2,
            fontFace: FontFamily.Default,
          },
        },

        // Name Field
        NameField: {
          y: 60,
          w: 800,

          Label: {
            y: 0,
            text: {
              text: "Full Name",
              fontSize: 22,
              textColor: 0xff888888,
              fontFace: FontFamily.Default,
            },
          },

          Value: {
            y: 38,
            text: {
              text: "—",
              fontSize: 36,
              fontStyle: FontStyle.Bold,
              textColor: 0xffffffff,
              fontFace: FontFamily.Default,
            },
          },

          Underline: {
            y: 92,
            w: 800,
            h: 1,
            rect: true,
            color: 0x33ffffff,
          },
        },

        // Email Field
        EmailField: {
          y: 210,
          w: 800,

          Label: {
            y: 0,
            text: {
              text: "Email Address",
              fontSize: 22,
              textColor: 0xff888888,
              fontFace: FontFamily.Default,
            },
          },

          Value: {
            y: 38,
            text: {
              text: "—",
              fontSize: 36,
              fontStyle: FontStyle.Bold,
              textColor: 0xffffffff,
              fontFace: FontFamily.Default,
            },
          },

          Underline: {
            y: 92,
            w: 800,
            h: 1,
            rect: true,
            color: 0x33ffffff,
          },
        },
      },

      // Account Status Section
      StatusSection: {
        x: 120,
        y: 575,
        w: 1680,

        SectionTitle: {
          y: 0,
          text: {
            text: "ACCOUNT STATUS",
            fontSize: 20,
            fontStyle: FontStyle.Bold,
            textColor: 0xff666666,
            letterSpacing: 2,
            fontFace: FontFamily.Default,
          },
        },

        InfoGrid: {
          y: 60,
          w: 1680,

          // Status Column
          StatusColumn: {
            x: 0,
            y: 0,

            Label: {
              y: 0,
              text: {
                text: "Status",
                fontSize: 22,
                textColor: 0xff888888,
                fontFace: FontFamily.Default,
              },
            },

            Value: {
              y: 38,
              text: {
                text: "Active",
                fontSize: 32,
                fontStyle: FontStyle.Bold,
                textColor: 0xff10b981,
                fontFace: FontFamily.Default,
              },
            },

            StatusBadge: {
              x: 115,
              y: 45,
              w: 16,
              h: 16,
              rect: true,
              color: 0xff10b981,
              shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },
            },
          },

          // Member Since Column
          MemberColumn: {
            x: 400,
            y: 0,

            Label: {
              y: 0,
              text: {
                text: "Member Since",
                fontSize: 22,
                textColor: 0xff888888,
                fontFace: FontFamily.Default,
              },
            },

            Value: {
              y: 38,
              text: {
                text: "—",
                fontSize: 32,
                fontStyle: FontStyle.Bold,
                textColor: 0xffffffff,
                fontFace: FontFamily.Default,
              },
            },
          },

          // Last Login Column
          LastLoginColumn: {
            x: 800,
            y: 0,

            Label: {
              y: 0,
              text: {
                text: "Last Login",
                fontSize: 22,
                textColor: 0xff888888,
                fontFace: FontFamily.Default,
              },
            },

            Value: {
              y: 38,
              text: {
                text: "—",
                fontSize: 32,
                fontStyle: FontStyle.Bold,
                textColor: 0xffffffff,
                fontFace: FontFamily.Default,
              },
            },
          },
        },

        Divider: {
          y: 140,
          w: 1680,
          h: 1,
          rect: true,
          color: 0x33ffffff,
        },
      },

      // Action Buttons Section
      ActionsSection: {
        x: 120,
        y: 760,
        w: 1680,

        SectionTitle: {
          y: 0,
          text: {
            text: "ACTIONS",
            fontSize: 20,
            fontStyle: FontStyle.Bold,
            textColor: 0xff666666,
            letterSpacing: 2,
            fontFace: FontFamily.Default,
          },
        },

        ButtonContainer: {
          y: 60,

          BackButton: {
            x: 0,
            y: 0,
            w: 220,
            h: 80,
            rect: true,
            color: 0xff333333,
            alpha: 0.5,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

            Label: {
              x: 110,
              y: 40,
              mount: 0.5,
              text: {
                text: "← Back",
                fontSize: 32,
                fontStyle: FontStyle.Bold,
                textColor: 0xff999999,
                fontFace: FontFamily.Default,
              },
            },
          },

          SignOutButton: {
            x: 260,
            y: 0,
            w: 340,
            h: 80,
            rect: true,
            color: 0xff992222,
            alpha: 0.5,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

            Label: {
              x: 170,
              y: 40,
              mount: 0.5,
              text: {
                text: "Sign Out",
                fontSize: 32,
                fontStyle: FontStyle.Bold,
                textColor: 0xffcccccc,
                fontFace: FontFamily.Default,
              },
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

    // Update Personal Information Section
    const personalSection = this.tag("PersonalInfoSection");
    if (personalSection) {
      // Update name
      const nameField = personalSection.tag("NameField");
      if (nameField) {
        const nameValue = nameField.tag("Value");
        if (nameValue && nameValue.text) {
          nameValue.text.text = this.user.display_name || "Not Set";
        }
      }

      // Update email
      const emailField = personalSection.tag("EmailField");
      if (emailField) {
        const emailValue = emailField.tag("Value");
        if (emailValue && emailValue.text) {
          emailValue.text.text = this.user.email;
        }
      }
    }

    // Update Status Section
    const statusSection = this.tag("StatusSection");
    if (statusSection) {
      const infoGrid = statusSection.tag("InfoGrid");
      if (infoGrid) {
        // Update member since
        const memberColumn = infoGrid.tag("MemberColumn");
        if (memberColumn) {
          const memberValue = memberColumn.tag("Value");
          if (memberValue && memberValue.text && this.user.created_at) {
            const date = new Date(this.user.created_at);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
            memberValue.text.text = formattedDate;
          }
        }

        // Update last login
        const lastLoginColumn = infoGrid.tag("LastLoginColumn");
        if (lastLoginColumn) {
          const lastLoginValue = lastLoginColumn.tag("Value");
          if (lastLoginValue && lastLoginValue.text) {
            if (this.user.last_login) {
              const loginDate = new Date(this.user.last_login);
              const now = new Date();
              const diffMs = now.getTime() - loginDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);

              let timeAgo = "";
              if (diffMins < 60) {
                timeAgo = `${diffMins} min ago`;
              } else if (diffHours < 24) {
                timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
              } else {
                timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
              }
              lastLoginValue.text.text = timeAgo;
            } else {
              lastLoginValue.text.text = "Just now";
            }
          }
        }
      }
    }

    this.stage.update();
  }

  private _updateFocus(): void {
    const actionsSection = this.tag("ActionsSection");
    if (!actionsSection) return;

    const buttonContainer = actionsSection.tag("ButtonContainer");
    if (!buttonContainer) return;

    const backButton = buttonContainer.tag("BackButton");
    const signOutButton = buttonContainer.tag("SignOutButton");

    // Back button focus states
    if (backButton) {
      const backLabel = backButton.tag("Label");

      if (this.focusedButton === "back") {
        backButton.setSmooth("alpha", 1, { duration: 0.2 });
        backButton.setSmooth("color", 0xff666666, { duration: 0.2 });
        backButton.setSmooth("scale", 1.05, { duration: 0.2 });
        if (backLabel && backLabel.text) {
          backLabel.text.textColor = 0xffffffff;
        }
      } else {
        backButton.setSmooth("alpha", 0.5, { duration: 0.2 });
        backButton.setSmooth("color", 0xff333333, { duration: 0.2 });
        backButton.setSmooth("scale", 1, { duration: 0.2 });
        if (backLabel && backLabel.text) {
          backLabel.text.textColor = 0xff999999;
        }
      }
    }

    // Sign Out button focus states
    if (signOutButton) {
      const signOutLabel = signOutButton.tag("Label");

      if (this.focusedButton === "signout") {
        signOutButton.setSmooth("alpha", 1, { duration: 0.2 });
        signOutButton.setSmooth("color", 0xffff4444, { duration: 0.2 });
        signOutButton.setSmooth("scale", 1.05, { duration: 0.2 });
        if (signOutLabel && signOutLabel.text) {
          signOutLabel.text.textColor = 0xffffffff;
        }
      } else {
        signOutButton.setSmooth("alpha", 0.5, { duration: 0.2 });
        signOutButton.setSmooth("color", 0xff992222, { duration: 0.2 });
        signOutButton.setSmooth("scale", 1, { duration: 0.2 });
        if (signOutLabel && signOutLabel.text) {
          signOutLabel.text.textColor = 0xffcccccc;
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
