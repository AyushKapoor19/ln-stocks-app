/**
 * Email Sign In Tab
 * Email + Password form with keyboard
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../../constants/Fonts";
import Keyboard from "../../../components/Keyboard";
import { authApi } from "../../../services/authApi";

type FocusedElement = "email" | "password" | "signin" | "signup";

export default class EmailSignInTab extends Lightning.Component {
  private focusedElement: FocusedElement = "email";
  private showKeyboard: boolean = false;
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

        EmailField: this._createInputField(0, "Email", "yourname@example.com"),
        PasswordField: this._createInputField(110, "Password", "Enter your password"),

        SignInButton: {
          x: 0,
          y: 270,
          w: 900,
          h: 80,
          rect: true,
          color: Colors.authAccent,
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
        colorTop: 0xf8001a0d,
        colorBottom: 0xfa000000,
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
              fontSize: 38,
              fontStyle: FontStyle.Bold,
              textColor: 0xf0ffffff,
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
          color: 0x40000000,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 18 },

          Placeholder: {
            x: 860,
            y: 45,
            mount: 0.5,
            text: {
              text: "Navigate with remote, press OK to select",
              fontSize: 24,
              textColor: 0x50ffffff,
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
              textColor: 0xffffffff,
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

  private static _createInputField(yPos: number, label: string, placeholder: string): object {
    return {
      x: 0,
      y: yPos,
      w: 900,
      h: 90,
      rect: true,
      color: Colors.authInputBackground,
      shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

      FocusBorder: {
        x: -3,
        y: -3,
        w: 906,
        h: 96,
        rect: true,
        color: Colors.authAccent,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 14 },
        alpha: 0,
        zIndex: -1,
      },

      Label: {
        x: 30,
        y: 18,
        text: {
          text: label,
          fontSize: FontSize.Small,
          textColor: Colors.textTertiary,
          fontFace: FontFamily.Default,
        },
      },

      Value: {
        x: 30,
        y: 50,
        text: {
          text: placeholder,
          fontSize: 28,
          textColor: Colors.textQuaternary,
          fontFace: FontFamily.Default,
        },
      },
    };
  }

  _getFocused(): Lightning.Component {
    if (this.showKeyboard) {
      const keyboardContainer = this.tag("KeyboardContainer");
      if (keyboardContainer) {
        const keyboard = keyboardContainer.tag("KeyboardComponent");
        if (keyboard) {
          return keyboard as Lightning.Component;
        }
      }
    }
    return this;
  }

  _handleUp(): boolean {
    if (this.showKeyboard) return false;

    const focusOrder: FocusedElement[] = ["email", "password", "signin", "signup"];
    const currentIndex = focusOrder.indexOf(this.focusedElement);
    if (currentIndex > 0) {
      this.focusedElement = focusOrder[currentIndex - 1];
      this._updateFocus();
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).fireAncestors("$focusBackToTab");
    return true;
  }

  _handleDown(): boolean {
    if (this.showKeyboard) return false;

    const focusOrder: FocusedElement[] = ["email", "password", "signin", "signup"];
    const currentIndex = focusOrder.indexOf(this.focusedElement);
    if (currentIndex < focusOrder.length - 1) {
      this.focusedElement = focusOrder[currentIndex + 1];
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleEnter(): boolean {
    if (this.focusedElement === "email" || this.focusedElement === "password") {
      this._showKeyboard();
      return true;
    }

    if (this.focusedElement === "signin") {
      void this._handleSignIn();
      return true;
    }

    if (this.focusedElement === "signup") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).fireAncestors("$navigateToSignUp");
      return true;
    }

    return false;
  }

  _handleBack(): boolean {
    if (this.showKeyboard) {
      this._hideKeyboard();
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
    console.log("📝 Key captured:", key);

    // Capture printable characters (single character keys)
    // This includes letters, numbers, symbols
    if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      this._addCharacter(key);
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
      return;
    }

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

  private _showKeyboard(): void {
    this.showKeyboard = true;

    const overlay = this.tag("KeyboardOverlay");
    const keyboardContainer = this.tag("KeyboardContainer");

    if (overlay) {
      overlay.patch({ visible: true });
      overlay.setSmooth("alpha", 1, { duration: 0.3 });
    }

    if (keyboardContainer) {
      keyboardContainer.patch({ visible: true });
      keyboardContainer.setSmooth("alpha", 1, { duration: 0.3 });

      const header = keyboardContainer.tag("Header");
      if (header) {
        const title = header.tag("Title");
        if (title && title.text) {
          if (this.focusedElement === "email") {
            title.text.text = "Enter your email";
          } else if (this.focusedElement === "password") {
            title.text.text = "Enter your password";
          }
        }
      }

      this._updateKeyboardDisplay();
    }

    this.stage.update();
  }

  private _hideKeyboard(): void {
    this.showKeyboard = false;

    const overlay = this.tag("KeyboardOverlay");
    const keyboardContainer = this.tag("KeyboardContainer");

    if (overlay) {
      overlay.setSmooth("alpha", 0, { duration: 0.3 });
      setTimeout(() => {
        overlay.patch({ visible: false });
      }, 300);
    }

    if (keyboardContainer) {
      keyboardContainer.setSmooth("alpha", 0, { duration: 0.3 });
      setTimeout(() => {
        keyboardContainer.patch({ visible: false });
      }, 300);
    }

    this._updateFieldDisplay();
  }

  private _updateKeyboardDisplay(): void {
    const keyboardContainer = this.tag("KeyboardContainer");
    if (!keyboardContainer) return;

    const inputDisplay = keyboardContainer.tag("InputDisplay");
    const header = keyboardContainer.tag("Header");
    if (!inputDisplay || !header) return;

    const inputText = inputDisplay.tag("InputText");
    const placeholder = inputDisplay.tag("Placeholder");
    const title = header.tag("Title");

    let displayValue = "";
    let titleText = "";
    
    if (this.focusedElement === "email") {
      displayValue = this.emailValue;
      titleText = "Email";
    } else if (this.focusedElement === "password") {
      displayValue = "\u25CF".repeat(this.passwordValue.length);
      titleText = "Password";
    }

    if (title && title.text) {
      title.text.text = titleText;
    }

    if (placeholder) {
      placeholder.patch({
        alpha: displayValue.length > 0 ? 0 : 1,
      });
    }

    if (inputText) {
      inputText.patch({
        text: {
          text: displayValue,
        },
      });
    }

    this.stage.update();
  }

  private _updateFieldDisplay(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const emailField = formContainer.tag("EmailField");
    const passwordField = formContainer.tag("PasswordField");

    if (emailField) {
      const emailValue = emailField.tag("Value");
      if (emailValue) {
        emailValue.patch({
          text: {
            text: this.emailValue || "yourname@example.com",
            textColor: this.emailValue ? Colors.textPrimary : Colors.textQuaternary,
          },
        });
      }
    }

    if (passwordField) {
      const passwordValue = passwordField.tag("Value");
      if (passwordValue) {
        passwordValue.patch({
          text: {
            text: this.passwordValue
              ? "\u2022".repeat(this.passwordValue.length)
              : "Enter your password",
            textColor: this.passwordValue ? Colors.textPrimary : Colors.textQuaternary,
          },
        });
      }
    }

    this.stage.update();
  }

  private _updateFocus(): void {
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
        if (underline) {
          underline.setSmooth("alpha", isFocused ? 1 : 0, { duration: 0.2 });
        }
      } else if (name === "signin") {
        element.patch({
          color: isFocused ? Colors.authAccentHover : Colors.authAccent,
        });
      } else {
        const border = element.tag("FocusBorder");
        if (border) {
          border.setSmooth("alpha", isFocused ? 1 : 0, { duration: 0.2 });
        }
      }
    });
  }

  private _addCharacter(char: string): void {
    if (this.focusedElement === "email") {
      this.emailValue += char;
    } else if (this.focusedElement === "password") {
      this.passwordValue += char;
    }
    
    // Update both keyboard display (if shown) and field display
    if (this.showKeyboard) {
      this._updateKeyboardDisplay();
    } else {
      this._updateFieldDisplay();
    }
  }

  private _deleteCharacter(): void {
    if (this.focusedElement === "email" && this.emailValue.length > 0) {
      this.emailValue = this.emailValue.slice(0, -1);
    } else if (this.focusedElement === "password" && this.passwordValue.length > 0) {
      this.passwordValue = this.passwordValue.slice(0, -1);
    }
    
    // Update both keyboard display (if shown) and field display
    if (this.showKeyboard) {
      this._updateKeyboardDisplay();
    } else {
      this._updateFieldDisplay();
    }
  }

  private _clearField(): void {
    if (this.focusedElement === "email") {
      this.emailValue = "";
    } else if (this.focusedElement === "password") {
      this.passwordValue = "";
    }
    this._updateKeyboardDisplay();
  }

  private async _handleSignIn(): Promise<void> {
    if (!this.emailValue || !this.passwordValue) {
      console.error("❌ Email and password are required");
      return;
    }

    console.log("🚀 Signing in...");

    const response = await authApi.login({
      email: this.emailValue,
      password: this.passwordValue,
    });

    if (response && response.success && response.token && response.user) {
      console.log("✅ Sign in successful!");
      authApi.saveToken(response.token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).fireAncestors("$authSuccess", {
        user: response.user,
        token: response.token,
      });
    } else {
      console.error("❌ Sign in failed:", response?.error);
    }
  }

  _init(): void {
    this._updateFieldDisplay();
  }

  _focus(): void {
    // Focus first field when user navigates into the form
    this.focusedElement = "email";
    this._updateFocus();
  }

  _clearAllFocus(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const elements: string[] = [
      "EmailField",
      "PasswordField",
      "SignInButton",
      "SignUpButton",
    ];

    elements.forEach((tag) => {
      const element = formContainer.tag(tag);
      if (!element) return;

      if (tag === "SignUpButton") {
        const underline = element.tag("Underline");
        if (underline) {
          underline.setSmooth("alpha", 0, { duration: 0.2 });
        }
      } else if (tag === "SignInButton") {
        element.patch({
          color: Colors.authAccent,
        });
      } else {
        const border = element.tag("FocusBorder");
        if (border) {
          border.setSmooth("alpha", 0, { duration: 0.2 });
        }
      }
    });

    this.stage.update();
  }
}

