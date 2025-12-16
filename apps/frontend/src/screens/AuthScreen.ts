/**
 * Main Authentication Screen
 * Handles both Sign In and Sign Up flows
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import Keyboard from "../components/Keyboard";
import { authApi } from "../services/authApi";

type AuthMode = "selection" | "signin" | "signup" | "qrcode";
type InputField = "email" | "password" | "name" | null;

export default class AuthScreen extends BaseScreen {
  private mode: AuthMode = "selection";
  private focusIndex = 0; // For button/field navigation
  private emailValue: string = "";
  private passwordValue: string = "";
  private nameValue: string = "";
  private activeField: InputField = null;
  private showKeyboard: boolean = false;

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

      // Background elements
      BackgroundGradient: {
        x: 0,
        y: 0,
        w: 1920,
        h: 400,
        rect: true,
        colorTop: 0xff001a0f,
        colorBottom: Colors.black,
      },

      StockTickerBar: {
        x: 0,
        y: 0,
        w: 1920,
        h: 6,
        rect: true,
        color: Colors.stockGreenBright,
      },

      // Title
      TitleContainer: {
        x: 120,
        y: 120,
        MainTitle: {
          y: 0,
          text: {
            text: "Welcome to Stocks",
            fontSize: 96,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },
        Subtitle: {
          y: 120,
          text: {
            text: "Sign in or create an account",
            fontSize: FontSize.Large,
            textColor: Colors.stockGreenBright,
            fontFace: FontFamily.Default,
          },
        },
      },

      // Selection Screen (initial)
      SelectionScreen: {
        x: 120,
        y: 380,
        alpha: 1,
        visible: true,

        SignInButton: {
          x: 0,
          y: 0,
          w: 400,
          h: 100,
          rect: true,
          color: Colors.stockGreenBright,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Label: {
            x: 200,
            y: 50,
            mount: 0.5,
            text: {
              text: "Sign In",
              fontSize: FontSize.XLarge,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        SignUpButton: {
          x: 450,
          y: 0,
          w: 400,
          h: 100,
          rect: true,
          color: Colors.cardBackground,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Label: {
            x: 200,
            y: 50,
            mount: 0.5,
            text: {
              text: "Sign Up",
              fontSize: FontSize.XLarge,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },

        QRButton: {
          x: 0,
          y: 140,
          w: 850,
          h: 100,
          rect: true,
          color: 0xff0a1a15,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Label: {
            x: 425,
            y: 50,
            mount: 0.5,
            text: {
              text: "📱  Sign In with Mobile QR Code",
              fontSize: FontSize.Large,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      // Form Screen (for sign in/sign up)
      FormScreen: {
        x: 120,
        y: 380,
        alpha: 0,
        visible: false,

        EmailField: this._createInputField(0, "Email", "📧"),
        PasswordField: this._createInputField(150, "Password", "🔒"),
        NameField: this._createInputField(300, "Name", "👤"),

        SubmitButton: {
          x: 0,
          y: 470,
          w: 900,
          h: 100,
          rect: true,
          color: Colors.stockGreenBright,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Label: {
            x: 450,
            y: 50,
            mount: 0.5,
            text: {
              text: "Continue",
              fontSize: FontSize.XLarge,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        BackButton: {
          x: 0,
          y: 600,
          w: 200,
          h: 60,
          rect: true,
          color: Colors.transparent,
          Label: {
            x: 100,
            y: 30,
            mount: 0.5,
            text: {
              text: "← Back",
              fontSize: FontSize.Body,
              textColor: Colors.textSecondary,
              fontFace: FontFamily.Default,
            },
          },
        },
      },

      // Blur overlay for keyboard
      BlurOverlay: {
        x: 0,
        y: 0,
        w: 1920,
        h: 1080,
        rect: true,
        color: 0xcc000000,
        alpha: 0,
        visible: false,
        zIndex: 100,
      },

      // Keyboard container
      KeyboardContainer: {
        x: 260,
        y: 200,
        w: 1400,
        h: 650,
        alpha: 0,
        visible: false,
        zIndex: 101,

        Background: {
          x: 0,
          y: 0,
          w: 1400,
          h: 650,
          rect: true,
          color: 0xff1a1a1a,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },
        },

        TopBar: {
          x: 0,
          y: 0,
          w: 1400,
          h: 6,
          rect: true,
          color: Colors.stockGreenBright,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: [20, 20, 0, 0],
          },
        },

        Title: {
          x: 700,
          y: 40,
          mount: 0.5,
          text: {
            text: "Enter your email",
            fontSize: 36,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        InputDisplay: {
          x: 50,
          y: 100,
          w: 1300,
          h: 100,
          rect: true,
          color: 0xff0a1a15,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },

          GreenAccent: {
            x: 0,
            y: 0,
            w: 6,
            h: 100,
            rect: true,
            color: Colors.stockGreenBright,
            shader: {
              type: Lightning.shaders.RoundedRectangle,
              radius: [16, 0, 0, 16],
            },
          },

          Icon: {
            x: 50,
            y: 50,
            mount: 0.5,
            text: {
              text: "✉️",
              fontSize: 40,
              fontFace: FontFamily.Default,
            },
          },

          InputText: {
            x: 100,
            y: 50,
            mount: { x: 0, y: 0.5 },
            text: {
              text: "",
              fontSize: 32,
              textColor: Colors.textPrimary,
              fontFace: FontFamily.Default,
            },
          },
        },

        KeyboardComponent: {
          x: 0,
          y: 230,
          type: Keyboard,
        },
      },
    };
  }

  private static _createInputField(yPos: number, label: string, icon: string): object {
    return {
      x: 0,
      y: yPos,
      w: 900,
      h: 120,
      rect: true,
      color: 0xff0a1a15,
      shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

      FocusBorder: {
        x: 0,
        y: 0,
        w: 900,
        h: 120,
        rect: true,
        color: Colors.stockGreenBright,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
        alpha: 0,
      },

      Icon: {
        x: 40,
        y: 60,
        mount: 0.5,
        text: {
          text: icon,
          fontSize: 40,
          fontFace: FontFamily.Default,
        },
      },

      Label: {
        x: 100,
        y: 30,
        text: {
          text: label,
          fontSize: FontSize.Small,
          textColor: Colors.textSecondary,
          fontFace: FontFamily.Default,
        },
      },

      Value: {
        x: 100,
        y: 70,
        text: {
          text: "",
          fontSize: 32,
          textColor: Colors.textPrimary,
          fontFace: FontFamily.Default,
        },
      },
    };
  }

  _init(): void {
    super._init();
    this._updateScreen();
  }

  private _updateScreen(): void {
    const selectionScreen = this.tag("SelectionScreen");
    const formScreen = this.tag("FormScreen");
    const titleContainer = this.tag("TitleContainer");

    if (!selectionScreen || !formScreen || !titleContainer) return;

    const mainTitle = titleContainer.tag("MainTitle");
    const subtitle = titleContainer.tag("Subtitle");

    if (this.mode === "selection") {
      selectionScreen.patch({ alpha: 1, visible: true });
      formScreen.patch({ alpha: 0, visible: false });
      if (mainTitle && mainTitle.text) {
        mainTitle.text.text = "Welcome to Stocks";
      }
      if (subtitle && subtitle.text) {
        subtitle.text.text = "Sign in or create an account";
      }
      this._updateSelectionFocus();
    } else if (this.mode === "signin" || this.mode === "signup") {
      selectionScreen.patch({ alpha: 0, visible: false });
      formScreen.patch({ alpha: 1, visible: true });
      if (mainTitle && mainTitle.text) {
        mainTitle.text.text = this.mode === "signin" ? "Sign In" : "Create Account";
      }
      if (subtitle && subtitle.text) {
        subtitle.text.text =
          this.mode === "signin"
            ? "Enter your credentials"
            : "Join our trading platform";
      }
      this._updateFormVisibility();
      this._updateFormFocus();
    }

    this.stage.update();
  }

  private _updateSelectionFocus(): void {
    const selectionScreen = this.tag("SelectionScreen");
    if (!selectionScreen) return;

    const buttons = ["SignInButton", "SignUpButton", "QRButton"];
    buttons.forEach((btnName, index) => {
      const btn = selectionScreen.tag(btnName);
      if (btn) {
        const isFocused = index === this.focusIndex;
        btn.patch({
          color:
            index === 0 && isFocused
              ? Colors.stockGreenBright
              : index === 0
              ? 0xff0d9959
              : isFocused
              ? Colors.cardBackground
              : 0xff0a1a15,
        });
        if (isFocused) {
          btn.setSmooth("scale", 1.05, { duration: 0.2 });
        } else {
          btn.setSmooth("scale", 1, { duration: 0.2 });
        }
      }
    });
  }

  private _updateFormVisibility(): void {
    const formScreen = this.tag("FormScreen");
    if (!formScreen) return;

    const nameField = formScreen.tag("NameField");
    if (nameField) {
      nameField.patch({
        visible: this.mode === "signup",
        alpha: this.mode === "signup" ? 1 : 0,
      });
    }
  }

  private _updateFormFocus(): void {
    const formScreen = this.tag("FormScreen");
    if (!formScreen) return;

    const fields = ["EmailField", "PasswordField"];
    if (this.mode === "signup") {
      fields.push("NameField");
    }
    fields.push("SubmitButton", "BackButton");

    fields.forEach((fieldName, index) => {
      const field = formScreen.tag(fieldName);
      if (field) {
        const border = field.tag("FocusBorder");
        const isFocused = index === this.focusIndex;
        if (border) {
          border.setSmooth("alpha", isFocused ? 0.5 : 0, { duration: 0.2 });
        }
        if (isFocused) {
          field.setSmooth("scale", 1.02, { duration: 0.2 });
        } else {
          field.setSmooth("scale", 1, { duration: 0.2 });
        }
      }
    });
  }

  _handleUp(): boolean {
    if (this.showKeyboard) return false;

    if (this.focusIndex > 0) {
      this.focusIndex--;
      if (this.mode === "selection") {
        this._updateSelectionFocus();
      } else {
        this._updateFormFocus();
      }
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.showKeyboard) return false;

    const maxIndex =
      this.mode === "selection"
        ? 2
        : this.mode === "signup"
        ? 4
        : 3;

    if (this.focusIndex < maxIndex) {
      this.focusIndex++;
      if (this.mode === "selection") {
        this._updateSelectionFocus();
      } else {
        this._updateFormFocus();
      }
      return true;
    }
    return false;
  }

  _handleEnter(): boolean {
    console.log(`📍 Enter pressed: mode=${this.mode}, focusIndex=${this.focusIndex}`);

    if (this.mode === "selection") {
      if (this.focusIndex === 0) {
        this.mode = "signin";
        this.focusIndex = 0;
        this._updateScreen();
        return true;
      } else if (this.focusIndex === 1) {
        this.mode = "signup";
        this.focusIndex = 0;
        this._updateScreen();
        return true;
      } else if (this.focusIndex === 2) {
        this.mode = "qrcode";
        this._updateScreen();
        return true;
      }
    } else if (this.mode === "signin" || this.mode === "signup") {
      if (this.focusIndex === 0) {
        this.activeField = "email";
        this._showKeyboard();
        return true;
      } else if (this.focusIndex === 1) {
        this.activeField = "password";
        this._showKeyboard();
        return true;
      } else if (this.focusIndex === 2 && this.mode === "signup") {
        this.activeField = "name";
        this._showKeyboard();
        return true;
      } else if (
        (this.focusIndex === 2 && this.mode === "signin") ||
        (this.focusIndex === 3 && this.mode === "signup")
      ) {
        this._handleSubmit();
        return true;
      } else {
        // Back button
        this.mode = "selection";
        this.focusIndex = 0;
        this._updateScreen();
        return true;
      }
    }

    return false;
  }

  _handleBack(): boolean {
    if (this.showKeyboard) {
      this._hideKeyboard();
      return true;
    }

    if (this.mode !== "selection") {
      this.mode = "selection";
      this.focusIndex = 0;
      this._updateScreen();
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).fireAncestors("$navigateBack");
    return true;
  }

  private _showKeyboard(): void {
    console.log("⌨️  Opening keyboard for field:", this.activeField);
    this.showKeyboard = true;

    const blurOverlay = this.tag("BlurOverlay");
    const keyboardContainer = this.tag("KeyboardContainer");

    if (blurOverlay) {
      blurOverlay.patch({ visible: true });
      blurOverlay.setSmooth("alpha", 1, { duration: 0.3 });
    }

    if (keyboardContainer) {
      keyboardContainer.patch({ visible: true });
      keyboardContainer.setSmooth("alpha", 1, { duration: 0.3 });

      const title = keyboardContainer.tag("Title");
      const icon = keyboardContainer.tag("InputDisplay")?.tag("Icon");

      if (title && title.text) {
        if (this.activeField === "email") {
          title.text.text = "Enter your email";
        } else if (this.activeField === "password") {
          title.text.text = "Enter your password";
        } else if (this.activeField === "name") {
          title.text.text = "Enter your name";
        }
      }

      if (icon && icon.text) {
        if (this.activeField === "email") {
          icon.text.text = "✉️";
        } else if (this.activeField === "password") {
          icon.text.text = "🔒";
        } else if (this.activeField === "name") {
          icon.text.text = "👤";
        }
      }

      this._updateKeyboardDisplay();
    }

    this.stage.update();
  }

  private _hideKeyboard(): void {
    this.showKeyboard = false;

    const blurOverlay = this.tag("BlurOverlay");
    const keyboardContainer = this.tag("KeyboardContainer");

    if (blurOverlay) {
      blurOverlay.setSmooth("alpha", 0, { duration: 0.3 });
      setTimeout(() => {
        blurOverlay.patch({ visible: false });
      }, 300);
    }

    if (keyboardContainer) {
      keyboardContainer.setSmooth("alpha", 0, { duration: 0.3 });
      setTimeout(() => {
        keyboardContainer.patch({ visible: false });
      }, 300);
    }

    this._updateFormDisplay();
  }

  private _updateKeyboardDisplay(): void {
    const keyboardContainer = this.tag("KeyboardContainer");
    if (!keyboardContainer) return;

    const inputDisplay = keyboardContainer.tag("InputDisplay");
    if (!inputDisplay) return;

    const inputText = inputDisplay.tag("InputText");
    if (!inputText || !inputText.text) return;

    let displayValue = "";
    if (this.activeField === "email") {
      displayValue = this.emailValue;
    } else if (this.activeField === "password") {
      displayValue = "\u2022".repeat(this.passwordValue.length);
    } else if (this.activeField === "name") {
      displayValue = this.nameValue;
    }

    inputText.text.text = displayValue || " ";
    inputText.text.textColor = displayValue ? Colors.textPrimary : Colors.textSecondary;

    this.stage.update();
  }

  private _updateFormDisplay(): void {
    const formScreen = this.tag("FormScreen");
    if (!formScreen) return;

    const emailField = formScreen.tag("EmailField")?.tag("Value");
    const passwordField = formScreen.tag("PasswordField")?.tag("Value");
    const nameField = formScreen.tag("NameField")?.tag("Value");

    if (emailField && emailField.text) {
      emailField.text.text = this.emailValue || "Enter your email";
      emailField.text.textColor = this.emailValue
        ? Colors.textPrimary
        : Colors.textSecondary;
    }

    if (passwordField && passwordField.text) {
      passwordField.text.text = this.passwordValue
        ? "\u2022".repeat(this.passwordValue.length)
        : "Enter your password";
      passwordField.text.textColor = this.passwordValue
        ? Colors.textPrimary
        : Colors.textSecondary;
    }

    if (nameField && nameField.text) {
      nameField.text.text = this.nameValue || "Enter your name";
      nameField.text.textColor = this.nameValue
        ? Colors.textPrimary
        : Colors.textSecondary;
    }

    this.stage.update();
  }

  $onKeyPress(event: { key: string }): void {
    const key = event.key;
    console.log(`🔤 Key pressed: ${key}`);

    if (key === "Done") {
      this._hideKeyboard();
      return;
    }

    if (key === "Space") {
      this._addCharacter(" ");
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

    if (key.length === 1) {
      this._addCharacter(key);
    }
  }

  $closeKeyboard(): void {
    this._hideKeyboard();
  }

  private _addCharacter(char: string): void {
    if (this.activeField === "email") {
      this.emailValue += char;
    } else if (this.activeField === "password") {
      this.passwordValue += char;
    } else if (this.activeField === "name") {
      this.nameValue += char;
    }
    this._updateKeyboardDisplay();
  }

  private _deleteCharacter(): void {
    if (this.activeField === "email" && this.emailValue.length > 0) {
      this.emailValue = this.emailValue.slice(0, -1);
    } else if (this.activeField === "password" && this.passwordValue.length > 0) {
      this.passwordValue = this.passwordValue.slice(0, -1);
    } else if (this.activeField === "name" && this.nameValue.length > 0) {
      this.nameValue = this.nameValue.slice(0, -1);
    }
    this._updateKeyboardDisplay();
  }

  private _clearField(): void {
    if (this.activeField === "email") {
      this.emailValue = "";
    } else if (this.activeField === "password") {
      this.passwordValue = "";
    } else if (this.activeField === "name") {
      this.nameValue = "";
    }
    this._updateKeyboardDisplay();
  }

  private async _handleSubmit(): Promise<void> {
    console.log("🚀 Submitting form:", this.mode);

    if (!this.emailValue || !this.passwordValue) {
      console.error("❌ Email and password are required");
      return;
    }

    if (this.mode === "signup" && !this.nameValue) {
      console.error("❌ Name is required for sign up");
      return;
    }

    if (this.mode === "signup") {
      const response = await authApi.signup(
        this.emailValue,
        this.passwordValue,
        this.nameValue
      );
      if (response && response.success && response.token && response.user) {
        console.log("✅ Sign up successful!");
        authApi.saveToken(response.token);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).fireAncestors("$authenticationSuccess", {
          user: response.user,
          token: response.token,
        });
      } else {
        console.error("❌ Sign up failed:", response?.error);
      }
    } else {
      const response = await authApi.login({
        email: this.emailValue,
        password: this.passwordValue,
      });
      if (response && response.success && response.token && response.user) {
        console.log("✅ Sign in successful!");
        authApi.saveToken(response.token);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).fireAncestors("$authenticationSuccess", {
          user: response.user,
          token: response.token,
        });
      } else {
        console.error("❌ Sign in failed:", response?.error);
      }
    }
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
}

