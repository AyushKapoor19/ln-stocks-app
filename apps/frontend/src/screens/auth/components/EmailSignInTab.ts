/**
 * Email Sign In Tab
 * Email + Password form with keyboard
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../../constants/Fonts";
import Keyboard from "../../../components/Keyboard";
import { authApi } from "../../../services/authApi";
import BaseEmailAuthTab from "./BaseEmailAuthTab";

type FocusedElement = "email" | "password" | "signin" | "signup";

export default class EmailSignInTab extends BaseEmailAuthTab {
  private focusedElement: FocusedElement = "email";
  private emailValue: string = "";
  private passwordValue: string = "";

  static _template(): object {
    return {
      w: 1680,
      h: 640,

      // Form Section
      FormContainer: {
        x: 0,
        y: 0,
        w: 900,
        h: 640,

        EmailField: this._createInputField(
          0,
          "Email",
          "investor@wallstreet.com",
        ),
        PasswordField: this._createInputField(110, "Password", "••••••••"),

        BackendErrorMessage: {
          x: 0,
          y: 240,
          alpha: 0,
          text: {
            text: "",
            fontSize: 22,
            textColor: Colors.error,
            fontFace: FontFamily.Default,
            wordWrapWidth: 900,
          },
        },

        SignInButton: {
          x: 0,
          y: 270,
          w: 900,
          h: 80,
          rect: true,
          color: Colors.authAccent,
          alpha: 0.7,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

          Label: {
            x: 450,
            y: 42,
            mount: 0.5,
            text: {
              text: "Sign In",
              fontSize: 32,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        DividerContainer: {
          x: 0,
          y: 390,
          w: 900,

          DividerText: {
            x: 450,
            y: 12,
            mount: 0.5,
            text: {
              text: "Don't have an account?",
              fontSize: FontSize.Body,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },
        },

        SignUpButton: {
          x: 345,
          y: 435,
          w: 210,
          h: 60,
          rect: true,
          color: Colors.transparent,

          Label: {
            x: 105,
            y: 30,
            mount: 0.5,
            text: {
              text: "Sign up",
              fontSize: FontSize.Large,
              textColor: Colors.authAccentLight,
              fontFace: FontFamily.Default,
            },
          },

          Underline: {
            x: 20,
            y: 56,
            w: 170,
            h: 2,
            rect: true,
            color: Colors.authAccentLight,
            alpha: 0,
          },
        },
      },

      // Keyboard Overlay (cover entire screen from TabContent position)
      KeyboardOverlay: {
        x: -120,
        y: -360,
        w: 1920,
        h: 1080,
        rect: true,
        colorTop: Colors.keyboardOverlayTop,
        colorBottom: Colors.keyboardOverlayBottom,
        alpha: 0,
        visible: false,
        zIndex: 100,
      },

      // Keyboard Container (centered on screen)
      KeyboardContainer: {
        x: (1920 - 1880) / 2 - 120, // Center 1880px container in 1920px screen, adjust for parent offset
        y: -150,
        w: 1880,
        h: 700,
        alpha: 0,
        visible: false,
        zIndex: 101,

        Header: {
          x: 0,
          y: 30,
          w: 1880,

          Title: {
            x: 940,
            y: 0,
            mount: 0.5,
            text: {
              text: "Email",
              fontSize: 48,
              fontStyle: FontStyle.Bold,
              textColor: Colors.keyboardHeaderText,
              fontFace: FontFamily.Default,
            },
          },
        },

        InputDisplay: {
          x: 80,
          y: 90,
          w: 1720,
          h: 90,
          rect: true,
          color: Colors.keyboardInputBg,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 18 },

          Placeholder: {
            x: 860,
            y: 45,
            mount: 0.5,
            text: {
              text: "Navigate with remote, press OK to select",
              fontSize: 24,
              textColor: Colors.keyboardPlaceholderText,
              fontFace: FontFamily.Default,
            },
          },

          InputText: {
            x: 860,
            y: 45,
            mount: 0.5,
            text: {
              fontSize: 34,
              fontStyle: "bold",
              textColor: Colors.keyboardInputText,
              letterSpacing: 1,
            },
          },
        },

        KeyboardComponent: {
          x: 0,
          y: 210,
          type: Keyboard,
        },
      },
    };
  }

  protected getFocusOrder(): string[] {
    return ["email", "password", "signin", "signup"];
  }

  protected getFieldName(fieldType: string): string {
    const fieldMap: Record<string, string> = {
      email: "EmailField",
      password: "PasswordField",
      signin: "SignInButton",
      signup: "SignUpButton",
    };
    return fieldMap[fieldType] || "";
  }

  protected getKeyboardTitle(fieldType: string): string {
    const titleMap: Record<string, string> = {
      email: "Enter your email",
      password: "Enter your password",
    };
    return titleMap[fieldType] || "";
  }

  protected async handleSubmit(): Promise<void> {
    await this._handleSignIn();
  }

  protected handleAlternateAction(): void {
    this.fireAncestors("$navigateToSignUp");
  }

  _handleEnter(): boolean {
    if (this.focusedElement === "email" || this.focusedElement === "password") {
      this._showKeyboard();
      return true;
    }

    if (this.focusedElement === "signin") {
      if (!this.isLoading) {
        void this.handleSubmit();
      }
      return true;
    }

    if (this.focusedElement === "signup") {
      this.handleAlternateAction();
      return true;
    }

    return false;
  }

  _captureKey(event: KeyboardEvent): boolean {
    // Only capture typing when in email or password fields (not on buttons)
    if (this.focusedElement !== "email" && this.focusedElement !== "password") {
      return false;
    }

    const key = event.key;

    // Capture printable characters (single character keys)
    // This includes letters, numbers, symbols
    if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      this._addCharacter(key);
      this._hideBackendError();
      return true; // Return true to prevent further processing
    }

    return false; // Let other keys pass through to _handleKey
  }

  _handleKey(event: KeyboardEvent): boolean {
    // Only handle special keys when in email or password fields
    if (this.focusedElement !== "email" && this.focusedElement !== "password") {
      return false;
    }

    const key = event.key;

    // Handle backspace
    if (key === "Backspace") {
      this._deleteCharacter();
      this._hideBackendError();
      return true;
    }

    return false;
  }

  $onKeyPress(event: { key: string }): void {
    const key = event.key;

    if (key === "Done") {
      this._hideKeyboard();
      return;
    }

    if (key === "Delete") {
      this._deleteCharacter();
      this._hideBackendError();
      return;
    }

    this._hideBackendError();

    if (key === "Clear") {
      this._clearField();
      return;
    }

    // Add character(s) - handles single chars and multi-char strings like ".com"
    if (key.length > 0) {
      this._addCharacter(key);
    }
  }

  $closeKeyboard(): void {
    this._hideKeyboard();
  }

  protected _updateFocus(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const elements: Array<{ name: FocusedElement; tag: string }> = [
      { name: "email", tag: "EmailField" },
      { name: "password", tag: "PasswordField" },
      { name: "signin", tag: "SignInButton" },
      { name: "signup", tag: "SignUpButton" },
    ];

    elements.forEach(({ name, tag }) => {
      const element = formContainer.tag(tag);
      if (!element) return;

      const isFocused = this.focusedElement === name;

      if (name === "signup") {
        const underline = element.tag("Underline");
        const label = element.tag("Label");
        if (underline) {
          underline.setSmooth("alpha", isFocused ? 1 : 0, { duration: 0.2 });
        }
        if (label) {
          label.patch({
            text: {
              textColor: isFocused ? Colors.white : Colors.authAccentLight,
            },
          });
        }
      } else if (name === "signin") {
        element.patch({
          color: isFocused ? Colors.authAccentLight : Colors.authAccent,
          alpha: isFocused ? 1 : 0.7,
        });
      } else {
        const border = element.tag("FocusBorder");
        if (border) {
          if (isFocused) {
            if (this.errorFields.has(tag)) {
              this.errorFields.delete(tag);
              const existingTimeout = this.errorGlowTimeouts.get(tag);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
                this.errorGlowTimeouts.delete(tag);
              }
            }

            border.patch({
              color: Colors.authAccent,
              shader: {
                type: Lightning.shaders.RoundedRectangle,
                radius: 14,
              },
            });
            border.setSmooth("alpha", 1, { duration: 0.2 });
          } else {
            border.setSmooth("alpha", 0, { duration: 0.2 });
          }
        }
      }
    });
  }

  private async _handleSignIn(): Promise<void> {
    let hasError = false;

    if (!this.emailValue) {
      this._shakeField("EmailField");
      this._showErrorGlow("EmailField");
      hasError = true;
    } else if (!this._isValidEmail(this.emailValue)) {
      this._shakeField("EmailField");
      this._showErrorGlow("EmailField");
      hasError = true;
    }

    if (!this.passwordValue) {
      this._shakeField("PasswordField");
      this._showErrorGlow("PasswordField");
      hasError = true;
    }

    if (hasError) return;

    this._setLoadingState(true);

    const response = await authApi.login({
      email: this.emailValue,
      password: this.passwordValue,
    });

    this._setLoadingState(false);

    if (response && response.success && response.token && response.user) {
      authApi.saveToken(response.token);
      this.fireAncestors("$authSuccess", {
        user: response.user,
        token: response.token,
      });
    } else {
      const errorMsg = response?.error || "Invalid credentials";

      if (errorMsg === "Invalid email or password") {
        this._showBackendError(errorMsg);
      }

      this._shakeField("EmailField");
      this._shakeField("PasswordField");
      this._showErrorGlow("EmailField");
      this._showErrorGlow("PasswordField");
    }
  }

  protected _setLoadingState(loading: boolean): void {
    this.isLoading = loading;
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const button = formContainer.tag("SignInButton");
    if (!button) return;

    const label = button.tag("Label");

    if (loading) {
      if (label && label.text) {
        label.text.text = "Signing in...";
      }
      button.patch({
        color: Colors.authAccentHover,
        alpha: 0.8,
      });
    } else {
      if (label && label.text) {
        label.text.text = "Sign In";
      }
      button.patch({
        color: Colors.authAccent,
        alpha: 1,
      });
    }
  }

  _init(): void {
    this._updateFieldDisplay();
  }

  _focus(): void {
    this.focusedElement = "email";
    this._updateFocus();
  }
}
