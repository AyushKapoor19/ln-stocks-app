/**
 * Email Sign Up Tab
 * Email + Password + Name form with keyboard
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../../constants/Fonts";
import Keyboard from "../../../components/Keyboard";
import { authApi } from "../../../services/authApi";

type FocusedElement = "name" | "email" | "password" | "signup" | "signin";

interface IPasswordRules {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

export default class EmailSignUpTab extends Lightning.Component {
  private focusedElement: FocusedElement = "name";
  private showKeyboard: boolean = false;
  private nameValue: string = "";
  private emailValue: string = "";
  private passwordValue: string = "";
  private isLoading: boolean = false;
  private shakingFields: Set<string> = new Set();
  private errorFields: Set<string> = new Set();
  private errorGlowTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private fieldOriginalPositions: Map<string, number> = new Map();
  private passwordRules: IPasswordRules = {
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  };

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

        NameField: this._createInputField(0, "Name", "Warren Buffett"),
        EmailField: this._createInputField(
          110,
          "Email",
          "investor@wallstreet.com"
        ),
        PasswordField: this._createInputField(
          220,
          "Password",
          "Create a secure password"
        ),

        BackendErrorMessage: {
          x: 0,
          y: 350,
          alpha: 0,
          text: {
            text: "",
            fontSize: 22,
            textColor: 0xffef4444,
            fontFace: FontFamily.Default,
            wordWrapWidth: 900,
          },
        },

        SignUpButton: {
          x: 0,
          y: 380,
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
              text: "Create Account",
              fontSize: 32,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        DividerContainer: {
          x: 0,
          y: 500,
          w: 900,

          DividerText: {
            x: 450,
            y: 12,
            mount: 0.5,
            text: {
              text: "Already have an account?",
              fontSize: FontSize.Body,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },
        },

        SignInButton: {
          x: 345,
          y: 545,
          w: 210,
          h: 60,
          rect: true,
          color: Colors.transparent,

          Label: {
            x: 105,
            y: 30,
            mount: 0.5,
            text: {
              text: "Sign in",
              fontSize: FontSize.Large,
              textColor: Colors.authAccentLight,
              fontFace: FontFamily.Default,
            },
          },

          Underline: {
            x: 30,
            y: 56,
            w: 150,
            h: 2,
            rect: true,
            color: Colors.authAccentLight,
            alpha: 0,
          },
        },
      },

      // Password Requirements Section
      PasswordRequirements: {
        x: 1200,
        y: 0,
        w: 580,
        h: 310,

        Title: {
          x: 0,
          y: 20,
          text: {
            text: "Security Requirements",
            fontSize: 32,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Divider: {
          x: 0,
          y: 70,
          w: 480,
          h: 2,
          rect: true,
          color: 0x40ffffff,
        },

        Rule1: this._createPasswordRule(110, "Minimum 8 characters"),
        Rule2: this._createPasswordRule(175, "At least one letter"),
        Rule3: this._createPasswordRule(240, "At least one number"),
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
              text: "Name",
              fontSize: 48,
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

  private static _createInputField(
    yPos: number,
    label: string,
    placeholder: string
  ): object {
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

  private static _createPasswordRule(yPos: number, ruleText: string): object {
    return {
      x: 0,
      y: yPos,
      w: 520,
      h: 42,

      CheckmarkContainer: {
        x: 0,
        y: 0,
        w: 38,
        h: 38,
        rect: true,
        color: 0x30ffffff,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 19 },

        CheckmarkInner: {
          x: 4,
          y: 4,
          w: 30,
          h: 30,
          rect: true,
          color: 0x25ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 15 },

          Icon: {
            x: 19,
            y: 15,
            mount: 0.5,
            text: {
              text: "✓",
              fontSize: 22,
              fontStyle: FontStyle.Bold,
              textColor: 0x40ffffff,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      Text: {
        x: 52,
        y: 8,
        text: {
          text: ruleText,
          fontSize: 28,
          textColor: 0x60ffffff,
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

    const focusOrder: FocusedElement[] = [
      "name",
      "email",
      "password",
      "signup",
      "signin",
    ];
    const currentIndex = focusOrder.indexOf(this.focusedElement);
    if (currentIndex > 0) {
      this.focusedElement = focusOrder[currentIndex - 1];
      this._updateFocus();
      return true;
    }

    this.fireAncestors("$focusBackToTab");
    return true;
  }

  _handleDown(): boolean {
    if (this.showKeyboard) return false;

    const focusOrder: FocusedElement[] = [
      "name",
      "email",
      "password",
      "signup",
      "signin",
    ];
    const currentIndex = focusOrder.indexOf(this.focusedElement);
    if (currentIndex < focusOrder.length - 1) {
      this.focusedElement = focusOrder[currentIndex + 1];
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleEnter(): boolean {
    if (
      this.focusedElement === "name" ||
      this.focusedElement === "email" ||
      this.focusedElement === "password"
    ) {
      this._showKeyboard();
      return true;
    }

    if (this.focusedElement === "signup") {
      if (!this.isLoading) {
        void this._handleSignUp();
      }
      return true;
    }

    if (this.focusedElement === "signin") {
      this.fireAncestors("$navigateToSignIn");
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
    // Only capture typing when in name, email, or password fields (not on buttons)
    if (
      this.focusedElement !== "name" &&
      this.focusedElement !== "email" &&
      this.focusedElement !== "password"
    ) {
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
    // Only handle special keys when in name, email, or password fields
    if (
      this.focusedElement !== "name" &&
      this.focusedElement !== "email" &&
      this.focusedElement !== "password"
    ) {
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
          if (this.focusedElement === "name") {
            title.text.text = "Enter your name";
          } else if (this.focusedElement === "email") {
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

    if (this.focusedElement === "name") {
      displayValue = this.nameValue;
      titleText = "Name";
    } else if (this.focusedElement === "email") {
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

    const nameField = formContainer.tag("NameField");
    const emailField = formContainer.tag("EmailField");
    const passwordField = formContainer.tag("PasswordField");

    if (nameField) {
      const nameValue = nameField.tag("Value");
      if (nameValue) {
        nameValue.patch({
          text: {
            text: this.nameValue || "Warren Buffett",
            textColor: this.nameValue
              ? Colors.textPrimary
              : Colors.textQuaternary,
          },
        });
      }
    }

    if (emailField) {
      const emailValue = emailField.tag("Value");
      if (emailValue) {
        emailValue.patch({
          text: {
            text: this.emailValue || "investor@wallstreet.com",
            textColor: this.emailValue
              ? Colors.textPrimary
              : Colors.textQuaternary,
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
              : "••••••••",
            textColor: this.passwordValue
              ? Colors.textPrimary
              : Colors.textQuaternary,
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
      { name: "name", tag: "NameField" },
      { name: "email", tag: "EmailField" },
      { name: "password", tag: "PasswordField" },
      { name: "signup", tag: "SignUpButton" },
      { name: "signin", tag: "SignInButton" },
    ];

    elements.forEach(({ name, tag }) => {
      const element = formContainer.tag(tag);
      if (!element) return;

      const isFocused = this.focusedElement === name;

      if (name === "signin") {
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
      } else if (name === "signup") {
        element.patch({
          color: isFocused ? Colors.authAccentLight : Colors.authAccent,
          alpha: isFocused ? 1 : 0.7,
        });
      } else {
        const border = element.tag("FocusBorder");
        if (border) {
          if (isFocused) {
            // Clear any error state when field receives focus
            if (this.errorFields.has(tag)) {
              this.errorFields.delete(tag);
              const existingTimeout = this.errorGlowTimeouts.get(tag);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
                this.errorGlowTimeouts.delete(tag);
              }
            }

            // Always apply green focus border
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

  private _addCharacter(char: string): void {
    if (this.focusedElement === "name") {
      this.nameValue += char;
    } else if (this.focusedElement === "email") {
      this.emailValue += char;
    } else if (this.focusedElement === "password") {
      this.passwordValue += char;
      this._validatePassword();
    }

    // Update both keyboard display (if shown) and field display
    if (this.showKeyboard) {
      this._updateKeyboardDisplay();
    } else {
      this._updateFieldDisplay();
    }
  }

  private _deleteCharacter(): void {
    if (this.focusedElement === "name" && this.nameValue.length > 0) {
      this.nameValue = this.nameValue.slice(0, -1);
    } else if (this.focusedElement === "email" && this.emailValue.length > 0) {
      this.emailValue = this.emailValue.slice(0, -1);
    } else if (
      this.focusedElement === "password" &&
      this.passwordValue.length > 0
    ) {
      this.passwordValue = this.passwordValue.slice(0, -1);
      this._validatePassword();
    }

    // Update both keyboard display (if shown) and field display
    if (this.showKeyboard) {
      this._updateKeyboardDisplay();
    } else {
      this._updateFieldDisplay();
    }
  }

  private _clearField(): void {
    if (this.focusedElement === "name") {
      this.nameValue = "";
    } else if (this.focusedElement === "email") {
      this.emailValue = "";
    } else if (this.focusedElement === "password") {
      this.passwordValue = "";
      this._validatePassword();
    }
    this._updateKeyboardDisplay();
  }

  private _validatePassword(): void {
    const password = this.passwordValue;

    this.passwordRules = {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };

    this._updatePasswordRulesDisplay();
  }

  private _updatePasswordRulesDisplay(): void {
    const requirements = this.tag("PasswordRequirements");
    if (!requirements) return;

    const rules = [
      { tag: "Rule1", valid: this.passwordRules.minLength },
      { tag: "Rule2", valid: this.passwordRules.hasLetter },
      { tag: "Rule3", valid: this.passwordRules.hasNumber },
    ];

    rules.forEach(({ tag, valid }) => {
      const rule = requirements.tag(tag);
      if (!rule) return;

      const checkmarkContainer = rule.tag("CheckmarkContainer");
      const text = rule.tag("Text");

      if (checkmarkContainer) {
        const checkmarkInner = checkmarkContainer.tag("CheckmarkInner");

        checkmarkContainer.patch({
          color: valid ? Colors.authAccent : 0x30ffffff,
        });

        if (checkmarkInner) {
          checkmarkInner.patch({
            color: valid ? Colors.authAccentHover : 0x25ffffff,
          });

          const icon = checkmarkInner.tag("Icon");
          if (icon && icon.text) {
            icon.text.textColor = valid ? 0xff000000 : 0x40ffffff;
          }
        }
      }

      if (text && text.text) {
        text.text.textColor = valid ? Colors.authAccent : 0x60ffffff;
      }
    });

    this.stage.update();
  }

  private async _handleSignUp(): Promise<void> {
    let hasError = false;

    // Check empty fields
    if (!this.nameValue) {
      this._shakeField("NameField");
      this._showErrorGlow("NameField");
      hasError = true;
    }

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
    } else if (
      !this.passwordRules.minLength ||
      !this.passwordRules.hasLetter ||
      !this.passwordRules.hasNumber
    ) {
      this._shakeField("PasswordField");
      this._showErrorGlow("PasswordField");
      hasError = true;
    }

    if (hasError) return;

    this._setLoadingState(true);

    const response = await authApi.signup(
      this.emailValue,
      this.passwordValue,
      this.nameValue
    );

    this._setLoadingState(false);

    if (response && response.success && response.token && response.user) {
      authApi.saveToken(response.token);
      this.fireAncestors("$authSuccess", {
        user: response.user,
        token: response.token,
      });
    } else {
      const errorMsg = response?.error || "Sign up failed";
      console.error("❌ Sign up failed:", errorMsg);

      if (errorMsg === "Email already registered") {
        this._showBackendError(errorMsg);
      }

      this._shakeField("EmailField");
      this._showErrorGlow("EmailField");
    }
  }

  private _showBackendError(message: string): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const errorMessage = formContainer.tag("BackendErrorMessage");
    if (errorMessage && errorMessage.text) {
      errorMessage.text.text = message;
      errorMessage.setSmooth("alpha", 1, { duration: 0.3 });
    }
  }

  private _hideBackendError(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const errorMessage = formContainer.tag("BackendErrorMessage");
    if (errorMessage) {
      errorMessage.setSmooth("alpha", 0, { duration: 0.3 });
    }
  }

  private _shakeField(fieldName: string): void {
    if (this.shakingFields.has(fieldName)) {
      return;
    }

    const formContainer = this.tag("FormContainer");
    if (!formContainer) {
      return;
    }

    const field = formContainer.tag(fieldName);
    if (!field) {
      return;
    }

    // Store original position on first shake
    if (!this.fieldOriginalPositions.has(fieldName)) {
      this.fieldOriginalPositions.set(fieldName, field.x || 0);
    }

    const originalX = this.fieldOriginalPositions.get(fieldName) || 0;
    this.shakingFields.add(fieldName);

    // Force field back to original position before shaking
    field.patch({ x: originalX });

    field.setSmooth("x", originalX + 15, { duration: 0.1 });
    setTimeout(() => {
      field.setSmooth("x", originalX - 15, { duration: 0.1 });
    }, 100);
    setTimeout(() => {
      field.setSmooth("x", originalX + 10, { duration: 0.1 });
    }, 200);
    setTimeout(() => {
      field.setSmooth("x", originalX - 10, { duration: 0.1 });
    }, 300);
    setTimeout(() => {
      field.setSmooth("x", originalX, { duration: 0.1 });
      this.shakingFields.delete(fieldName);
    }, 400);
  }

  private _showErrorGlow(fieldName: string): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) {
      return;
    }

    const field = formContainer.tag(fieldName);
    if (!field) {
      return;
    }

    const border = field.tag("FocusBorder");
    if (!border) {
      return;
    }

    // Clear any existing timeout for this field
    const existingTimeout = this.errorGlowTimeouts.get(fieldName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.errorGlowTimeouts.delete(fieldName);
    }

    const fieldNameMap: Record<string, FocusedElement> = {
      NameField: "name",
      EmailField: "email",
      PasswordField: "password",
    };

    const fieldElement = fieldNameMap[fieldName];

    // Always add to errorFields and show red border immediately
    this.errorFields.add(fieldName);

    // Force red border immediately, regardless of focus state
    border.patch({
      color: 0xffef4444,
      shader: {
        type: Lightning.shaders.RoundedRectangle,
        radius: 14,
      },
      alpha: 1,
    });

    // Set timeout to hide the glow after 1 second
    const timeoutId = setTimeout(() => {
      // Only proceed if this is still the active timeout for this field
      if (this.errorGlowTimeouts.get(fieldName) === timeoutId) {
        this.errorFields.delete(fieldName);
        this.errorGlowTimeouts.delete(fieldName);

        // If not focused, fade out the border
        if (this.focusedElement !== fieldElement) {
          border.setSmooth("alpha", 0, { duration: 0.3 });
          setTimeout(() => {
            border.patch({ color: Colors.authAccent });
          }, 300);
        } else {
          // If focused, just reset to green immediately
          border.patch({ color: Colors.authAccent });
        }
      }
    }, 1000);

    this.errorGlowTimeouts.set(fieldName, timeoutId);
  }

  private _isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private _setLoadingState(loading: boolean): void {
    this.isLoading = loading;
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const button = formContainer.tag("SignUpButton");
    if (!button) return;

    const label = button.tag("Label");

    if (loading) {
      if (label && label.text) {
        label.text.text = "Creating account...";
      }
      button.patch({
        color: Colors.authAccentHover,
        alpha: 0.8,
      });
    } else {
      if (label && label.text) {
        label.text.text = "Create Account";
      }
      button.patch({
        color: Colors.authAccent,
        alpha: 1,
      });
    }
  }

  _init(): void {
    this._updateFieldDisplay();
    this._validatePassword();
  }

  _focus(): void {
    // Focus first field when user navigates into the form
    this.focusedElement = "name";
    this._updateFocus();
  }

  _clearAllFocus(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const elements: string[] = [
      "NameField",
      "EmailField",
      "PasswordField",
      "SignUpButton",
      "SignInButton",
    ];

    elements.forEach((tag) => {
      const element = formContainer.tag(tag);
      if (!element) return;

      if (tag === "SignInButton") {
        const underline = element.tag("Underline");
        if (underline) {
          underline.setSmooth("alpha", 0, { duration: 0.2 });
        }
      } else if (tag === "SignUpButton") {
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
