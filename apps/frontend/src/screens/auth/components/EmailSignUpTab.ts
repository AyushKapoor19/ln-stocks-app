/**
 * Email Sign Up Tab
 * Email + Password + Name form with keyboard
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../../constants/Fonts";
import Keyboard from "../../../components/Keyboard";
import { authApi } from "../../../services/authApi";
import BaseEmailAuthTab from "./BaseEmailAuthTab";

type FocusedElement = "name" | "email" | "password" | "signup" | "signin";

interface IPasswordRules {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

export default class EmailSignUpTab extends BaseEmailAuthTab {
  private focusedElement: FocusedElement = "name";
  private nameValue: string = "";
  private emailValue: string = "";
  private passwordValue: string = "";
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
          "investor@wallstreet.com",
        ),
        PasswordField: this._createInputField(
          220,
          "Password",
          "Create a secure password",
        ),

        BackendErrorMessage: {
          x: 0,
          y: 350,
          alpha: 0,
          text: {
            text: "",
            fontSize: 22,
            textColor: Colors.error,
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
        x: 1300,
        y: 40,
        w: 480,
        h: 310,

        Title: {
          x: 0,
          y: 0,
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
          y: 50,
          w: 380,
          h: 2,
          rect: true,
          color: Colors.keyboardShaderBg,
        },

        Rule1: this._createPasswordRule(90, "Minimum 8 characters"),
        Rule2: this._createPasswordRule(155, "At least one letter"),
        Rule3: this._createPasswordRule(220, "At least one number"),
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
              text: "Name",
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
    return ["name", "email", "password", "signup", "signin"];
  }

  protected getFieldName(fieldType: string): string {
    const fieldMap: Record<string, string> = {
      name: "NameField",
      email: "EmailField",
      password: "PasswordField",
      signup: "SignUpButton",
      signin: "SignInButton",
    };
    return fieldMap[fieldType] || "";
  }

  protected getKeyboardTitle(fieldType: string): string {
    const titleMap: Record<string, string> = {
      name: "Enter your name",
      email: "Enter your email",
      password: "Enter your password",
    };
    return titleMap[fieldType] || "";
  }

  protected async handleSubmit(): Promise<void> {
    await this._handleSignUp();
  }

  protected handleAlternateAction(): void {
    this.fireAncestors("$navigateToSignIn");
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
        color: Colors.passwordCheckInactive,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 19 },

        CheckmarkInner: {
          x: 4,
          y: 4,
          w: 30,
          h: 30,
          rect: true,
          color: Colors.passwordCheckInactiveInner,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 15 },

          Icon: {
            x: 19,
            y: 15,
            mount: 0.5,
            text: {
              text: "✓",
              fontSize: 22,
              fontStyle: FontStyle.Bold,
              textColor: Colors.passwordCheckInactiveIcon,
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
          textColor: Colors.passwordCheckInactiveText,
          fontFace: FontFamily.Default,
        },
      },
    };
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
        void this.handleSubmit();
      }
      return true;
    }

    if (this.focusedElement === "signin") {
      this.handleAlternateAction();
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

  protected _updateFocus(): void {
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

  protected _addCharacter(char: string): void {
    if (this.focusedElement === "name") {
      this.nameValue += char;
    } else if (this.focusedElement === "email") {
      this.emailValue += char;
    } else if (this.focusedElement === "password") {
      this.passwordValue += char;
      this._validatePassword();
    }

    this._updateKeyboardDisplay();
    this._updateFieldDisplay();
    this._hideBackendError();
  }

  protected _deleteCharacter(): void {
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

    this._updateKeyboardDisplay();
    this._updateFieldDisplay();
    this._hideBackendError();
  }

  protected _clearField(): void {
    if (this.focusedElement === "name") {
      this.nameValue = "";
    } else if (this.focusedElement === "email") {
      this.emailValue = "";
    } else if (this.focusedElement === "password") {
      this.passwordValue = "";
      this._validatePassword();
    }
    this._updateKeyboardDisplay();
    this._updateFieldDisplay();
    this._hideBackendError();
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
          color: valid ? Colors.authAccent : Colors.passwordCheckInactive,
        });

        if (checkmarkInner) {
          checkmarkInner.patch({
            color: valid ? Colors.authAccentHover : Colors.passwordCheckInactiveInner,
          });

          const icon = checkmarkInner.tag("Icon");
          if (icon && icon.text) {
            icon.text.textColor = valid ? Colors.passwordCheckActiveIcon : Colors.passwordCheckInactiveIcon;
          }
        }
      }

      if (text && text.text) {
        text.text.textColor = valid ? Colors.authAccent : Colors.passwordCheckInactiveText;
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
      this.nameValue,
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

      if (errorMsg === "Email already registered") {
        this._showBackendError(errorMsg);
      }

      this._shakeField("EmailField");
      this._showErrorGlow("EmailField");
    }
  }

  protected _setLoadingState(loading: boolean): void {
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
    this.focusedElement = "name";
    this._updateFocus();
  }
}
