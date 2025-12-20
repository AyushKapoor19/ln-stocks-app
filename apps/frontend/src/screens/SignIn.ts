/**
 * SignIn Screen
 *
 * Two authentication methods:
 * 1. Use code (QR/Device code for mobile auth)
 * 2. Use email (Direct email/password login on TV)
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import { authApi } from "../services/authApi";
import type { IDeviceCodeResponse } from "../types/auth";
import Keyboard from "../components/Keyboard";

export default class SignIn extends BaseScreen {
  private selectedTabIndex = 0;
  private tabs = ["Use code", "Use email address"];
  private deviceCode: string = "";
  private pollInterval: NodeJS.Timeout | null = null;
  private qrImageUrl: string = "";

  // Email login state
  private emailFocusIndex = 0; // 0: email field, 1: password field, 2: sign in button
  private emailValue: string = "";
  private passwordValue: string = "";
  private showKeyboard: boolean = false;
  private activeField: "email" | "password" | null = null;

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

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

      TitleContainer: {
        x: 120,
        y: 120,

        MainTitle: {
          y: 0,
          text: {
            text: "Welcome Back",
            fontSize: 96,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          y: 120,
          text: {
            text: "Continue your investment journey",
            fontSize: FontSize.Large,
            textColor: Colors.stockGreenBright,
            fontFace: FontFamily.Default,
          },
        },

        TickerSymbol: {
          x: 0,
          y: 180,
          text: {
            text: "↗ MARKET OPEN",
            fontSize: FontSize.Body,
            textColor: Colors.stockGreenBright,
            fontFace: FontFamily.Default,
          },
        },
      },

      TabContainer: {
        x: 120,
        y: 380,

        Tab_UseCode_Card: {
          x: 0,
          y: 0,
          w: 280,
          h: 100,
          rect: true,
          color: Colors.stockGreenBright,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Tab_UseCode: {
            x: 140,
            y: 50,
            mount: 0.5,
            text: {
              text: "📱 Mobile Code",
              fontSize: FontSize.Large,
              fontStyle: FontStyle.Bold,
              textColor: Colors.black,
              fontFace: FontFamily.Default,
            },
          },
        },

        Tab_UseEmail_Card: {
          x: 320,
          y: 0,
          w: 280,
          h: 100,
          rect: true,
          color: Colors.cardBackground,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Tab_UseEmail: {
            x: 140,
            y: 50,
            mount: 0.5,
            text: {
              text: "✉️ Email Login",
              fontSize: FontSize.Large,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textSecondary,
              fontFace: FontFamily.Default,
            },
          },
        },

        Tab_UseCodeUnderline: {
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          alpha: 0,
        },
        Tab_UseEmailUnderline: {
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          alpha: 0,
        },
      },

      QRCodeContent: {
        x: 120,
        y: 520,
        w: 1680,
        h: 500,
        alpha: 1,

        LeftColumn: {
          x: 0,
          y: 0,
          w: 1000,

          InstructionCard: {
            y: 0,
            w: 900,
            h: 180,
            rect: true,
            color: 0xff0a1a15,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },

            IconGlow: {
              x: 40,
              y: 40,
              w: 100,
              h: 100,
              rect: true,
              color: Colors.stockGreenBright,
              shader: { type: Lightning.shaders.RoundedRectangle, radius: 50 },
              alpha: 0.2,
            },

            Icon: {
              x: 60,
              y: 60,
              text: {
                text: "📱",
                fontSize: 60,
                fontFace: FontFamily.Default,
              },
            },

            Title: {
              x: 180,
              y: 50,
              text: {
                text: "Quick Authentication",
                fontSize: FontSize.XLarge,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },

            Subtitle: {
              x: 180,
              y: 110,
              w: 680,
              text: {
                text: "Scan QR or enter code at stocks-app.com/verify",
                fontSize: FontSize.Body,
                textColor: Colors.stockGreenBright,
                fontFace: FontFamily.Default,
              },
            },
          },

          DeviceCodeLabel: {
            y: 220,
            text: {
              text: "YOUR TRADING CODE",
              fontSize: FontSize.Small,
              textColor: Colors.textSecondary,
              letterSpacing: 4,
              fontFace: FontFamily.Default,
            },
          },

          DeviceCodeContainer: {
            y: 270,
            Code1: this._createCodeBox(0, "E"),
            Code2: this._createCodeBox(130, "Y"),
            Code3: this._createCodeBox(260, "4"),
            Code4: this._createCodeBox(390, "M"),
            Code5: this._createCodeBox(520, "Q"),
            Code6: this._createCodeBox(650, "5"),
            Code7: this._createCodeBox(780, "B"),
          },
        },

        QRCodeCard: {
          x: 1168,
          y: 6,

          QRContainer: {
            x: 0,
            y: 0,
            w: 400,
            h: 400,
            rect: true,
            color: Colors.white,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
            QRImage: {
              x: 20,
              y: 20,
              w: 360,
              h: 360,
            },
          },
        },
      },
      EmailContent: {
        x: 120,
        y: 520,
        w: 1680,
        h: 500,
        alpha: 0,

        LoginForm: {
          x: 400,
          y: 50,
          w: 900,

          EmailFieldCard: {
            x: 0,
            y: 0,
            w: 900,
            h: 90,
            rect: true,
            color: 0xff0a1a15,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

            FocusBorder: {
              x: 0,
              y: 0,
              w: 900,
              h: 90,
              rect: true,
              color: Colors.stockGreenBright,
              shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
              alpha: 0,
            },

            Label: {
              x: 40,
              y: 20,
              text: {
                text: "Email",
                fontSize: FontSize.Small,
                textColor: Colors.textSecondary,
                fontFace: FontFamily.Default,
              },
            },

            InputText: {
              x: 40,
              y: 50,
              text: {
                text: "",
                fontSize: FontSize.Large,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },

            Placeholder: {
              x: 40,
              y: 50,
              text: {
                text: "trader@stocks.com",
                fontSize: FontSize.Large,
                textColor: Colors.textSecondary,
                fontFace: FontFamily.Default,
              },
            },
          },

          PasswordFieldCard: {
            x: 0,
            y: 120,
            w: 900,
            h: 90,
            rect: true,
            color: 0xff0a1a15,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

            FocusBorder: {
              x: 0,
              y: 0,
              w: 900,
              h: 90,
              rect: true,
              color: Colors.stockGreenBright,
              shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
              alpha: 0,
            },

            Label: {
              x: 40,
              y: 20,
              text: {
                text: "Password",
                fontSize: FontSize.Small,
                textColor: Colors.textSecondary,
                fontFace: FontFamily.Default,
              },
            },

            InputText: {
              x: 40,
              y: 50,
              text: {
                text: "",
                fontSize: FontSize.Large,
                textColor: Colors.textPrimary,
                fontFace: FontFamily.Default,
              },
            },

            Placeholder: {
              x: 40,
              y: 50,
              text: {
                text: "Enter password",
                fontSize: FontSize.Large,
                textColor: Colors.textSecondary,
                fontFace: FontFamily.Default,
              },
            },
          },

          LoginButton: {
            x: 0,
            y: 250,
            w: 900,
            h: 80,
            rect: true,
            color: Colors.stockGreenBright,
            shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

            ButtonText: {
              x: 450,
              y: 40,
              mount: 0.5,
              text: {
                text: "Sign In",
                fontSize: FontSize.Large,
                fontStyle: FontStyle.Bold,
                textColor: Colors.black,
                fontFace: FontFamily.Default,
              },
            },
          },
        },
      },

      BlurOverlay: {
        x: 0,
        y: 0,
        w: 1920,
        h: 1080,
        rect: true,
        color: 0xcc000000,
        alpha: 0,
        zIndex: 100,
      },

      KeyboardContainer: {
        x: 200,
        y: 150,
        w: 1520,
        h: 700,
        alpha: 0,
        zIndex: 101,

        KeyboardBackground: {
          x: 0,
          y: 0,
          w: 1520,
          h: 700,
          rect: true,
          color: 0xff1a1a1a,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },
        },

        GreenTopBar: {
          x: 0,
          y: 0,
          w: 1520,
          h: 6,
          rect: true,
          color: Colors.stockGreenBright,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: [24, 24, 0, 0],
          },
        },

        Title: {
          x: 760,
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

        InputDisplayCard: {
          x: 60,
          y: 100,
          w: 1400,
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
              text: "Email address",
              fontSize: 32,
              textColor: Colors.textSecondary,
              fontFace: FontFamily.Default,
              wordWrapWidth: 1250,
              maxLines: 1,
            },
          },

          Cursor: {
            x: 100,
            y: 30,
            w: 3,
            h: 40,
            rect: true,
            color: Colors.stockGreenBright,
            alpha: 0,
          },
        },

        Keyboard: {
          x: 60,
          y: 240,
          type: Keyboard,
        },
      },
    };
  }

  private static _createCodeBox(xPos: number, defaultChar: string): object {
    return {
      x: xPos,
      y: 0,
      w: 110,
      h: 140,
      rect: true,
      color: 0xff0a1a15,
      shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

      GreenBorder: {
        x: 0,
        y: 0,
        w: 110,
        h: 140,
        rect: true,
        color: Colors.stockGreenBright,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
        alpha: 0.4,
      },

      Label: {
        x: 55,
        y: 70,
        mount: 0.5,
        text: {
          text: defaultChar,
          fontSize: 72,
          fontStyle: FontStyle.Bold,
          textColor: Colors.stockGreenBright,
          fontFace: FontFamily.Default,
        },
      },
    };
  }

  async _init(): Promise<void> {
    super._init();
    this._updateContent();
    await this._generateDeviceCode();
  }

  _detach(): void {
    this._stopPolling();
  }

  _handleLeft(): boolean {
    if (this.selectedTabIndex === 1) {
      this.selectedTabIndex = 0;
      this._updateTabs();
      return true;
    }
    return false;
  }

  _handleRight(): boolean {
    if (this.selectedTabIndex === 0) {
      this.selectedTabIndex = 1;
      this._updateTabs();
      return true;
    }
    return false;
  }

  _handleUp(): boolean {
    if (this.selectedTabIndex === 1 && !this.showKeyboard) {
      if (this.emailFocusIndex > 0) {
        this.emailFocusIndex--;
        this._updateEmailFieldFocus();
        return true;
      }
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.selectedTabIndex === 1 && !this.showKeyboard) {
      if (this.emailFocusIndex < 2) {
        this.emailFocusIndex++;
        this._updateEmailFieldFocus();
        return true;
      }
    }
    return false;
  }

  _handleEnter(): boolean {
    if (this.selectedTabIndex === 1 && !this.showKeyboard) {
      if (this.emailFocusIndex === 0) {
        this.activeField = "email";
        this._showKeyboard();
        return true;
      } else if (this.emailFocusIndex === 1) {
        this.activeField = "password";
        this._showKeyboard();
        return true;
      } else if (this.emailFocusIndex === 2) {
        this._handleLogin();
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
    console.log("Navigating back to Home");
    this.fireAncestors("$navigateBack");
    return true;
  }

  $authenticationSuccess(data: { user: unknown; token: string }): void {
    console.log("✅ Authentication successful from child!");
    this.fireAncestors("$authenticationSuccess", data);
  }

  private _updateTabs(): void {
    const tabContainer = this.tag("TabContainer");
    if (!tabContainer) return;

    const useCodeCard = tabContainer.tag("Tab_UseCode_Card");
    const useCodeTab = tabContainer.tag("Tab_UseCode");
    const useEmailCard = tabContainer.tag("Tab_UseEmail_Card");
    const useEmailTab = tabContainer.tag("Tab_UseEmail");

    if (this.selectedTabIndex === 0) {
      if (useCodeCard) {
        useCodeCard.setSmooth("color", Colors.stockGreenBright, {
          duration: 0.3,
        });
        useCodeCard.setSmooth("alpha", 1, { duration: 0.3 });
      }
      if (useCodeTab && useCodeTab.text) {
        useCodeTab.text.textColor = Colors.black;
      }
      if (useEmailCard) {
        useEmailCard.setSmooth("color", Colors.cardBackground, {
          duration: 0.3,
        });
        useEmailCard.setSmooth("alpha", 0.5, { duration: 0.3 });
      }
      if (useEmailTab && useEmailTab.text) {
        useEmailTab.text.textColor = Colors.textSecondary;
      }
    } else {
      if (useCodeCard) {
        useCodeCard.setSmooth("color", Colors.cardBackground, {
          duration: 0.3,
        });
        useCodeCard.setSmooth("alpha", 0.5, { duration: 0.3 });
      }
      if (useCodeTab && useCodeTab.text) {
        useCodeTab.text.textColor = Colors.textSecondary;
      }
      if (useEmailCard) {
        useEmailCard.setSmooth("color", Colors.stockGreenBright, {
          duration: 0.3,
        });
        useEmailCard.setSmooth("alpha", 1, { duration: 0.3 });
      }
      if (useEmailTab && useEmailTab.text) {
        useEmailTab.text.textColor = Colors.black;
      }
    }

    this._updateContent();
    this.stage.update();
  }

  private _updateContent(): void {
    const qrCodeContent = this.tag("QRCodeContent");
    const emailContent = this.tag("EmailContent");

    if (this.selectedTabIndex === 0) {
      if (qrCodeContent) {
        qrCodeContent.setSmooth("alpha", 1, { duration: 0.3 });
      }
      if (emailContent) {
        emailContent.setSmooth("alpha", 0, { duration: 0.3 });
      }
    } else {
      if (qrCodeContent) {
        qrCodeContent.setSmooth("alpha", 0, { duration: 0.3 });
      }
      if (emailContent) {
        emailContent.setSmooth("alpha", 1, { duration: 0.3 });
      }
      this._updateEmailFieldFocus();
    }
  }

  private _updateEmailFieldFocus(): void {
    const emailContent = this.tag("EmailContent");
    if (!emailContent) return;
    const loginForm = emailContent.tag("LoginForm");
    if (!loginForm) return;

    const emailCard = loginForm.tag("EmailFieldCard");
    const passwordCard = loginForm.tag("PasswordFieldCard");
    const loginButton = loginForm.tag("LoginButton");

    if (emailCard) {
      const border = emailCard.tag("FocusBorder");
      if (border) {
        border.setSmooth("alpha", this.emailFocusIndex === 0 ? 0.5 : 0, {
          duration: 0.2,
        });
      }
    }

    if (passwordCard) {
      const border = passwordCard.tag("FocusBorder");
      if (border) {
        border.setSmooth("alpha", this.emailFocusIndex === 1 ? 0.5 : 0, {
          duration: 0.2,
        });
      }
    }

    if (loginButton) {
      loginButton.setSmooth(
        "color",
        this.emailFocusIndex === 2 ? Colors.stockGreenBright : 0xff0d9959,
        { duration: 0.2 }
      );
    }

    this.stage.update();
  }

  private _showKeyboard(): void {
    console.log("Opening keyboard for field:", this.activeField);
    this.showKeyboard = true;
    const blurOverlay = this.tag("BlurOverlay");
    const keyboardContainer = this.tag("KeyboardContainer");

    console.log("BlurOverlay found:", !!blurOverlay);
    console.log("KeyboardContainer found:", !!keyboardContainer);

    if (blurOverlay) {
      blurOverlay.setSmooth("alpha", 1, { duration: 0.3 });
      console.log("✅ Blur overlay shown");
    }

    if (keyboardContainer) {
      console.log(
        `📍 Keyboard position: x=${keyboardContainer.x}, y=${keyboardContainer.y}, zIndex=${keyboardContainer.zIndex}`
      );
      keyboardContainer.patch({ visible: true });
      keyboardContainer.setSmooth("alpha", 1, { duration: 0.3 });
      console.log("✅ Keyboard container shown");

      // Update the title and icon based on active field
      const title = keyboardContainer.tag("Title");
      const inputCard = keyboardContainer.tag("InputDisplayCard");

      if (title && title.text) {
        if (this.activeField === "email") {
          title.text.text = "Enter your email";
        } else if (this.activeField === "password") {
          title.text.text = "Enter your password";
        }
      }

      if (inputCard) {
        // Ensure input card is visible
        inputCard.patch({ visible: true, alpha: 1 });

        const icon = inputCard.tag("Icon");
        if (icon && icon.text) {
          if (this.activeField === "email") {
            icon.text.text = "✉️";
          } else if (this.activeField === "password") {
            icon.text.text = "🔒";
          }
        }
      }

      // Update the input display after a short delay to ensure keyboard is visible
      setTimeout(() => {
        this._updateKeyboardDisplay();
      }, 100);
    }
  }

  private _hideKeyboard(): void {
    this.showKeyboard = false;
    const blurOverlay = this.tag("BlurOverlay");
    const keyboardContainer = this.tag("KeyboardContainer");

    if (blurOverlay) {
      blurOverlay.setSmooth("alpha", 0, { duration: 0.3 });
    }

    if (keyboardContainer) {
      keyboardContainer.setSmooth("alpha", 0, { duration: 0.3 });
    }
  }

  $closeKeyboard(): void {
    this._hideKeyboard();
  }

  $onKeyPress(event: { key: string }): void {
    const key = event.key;
    console.log(`🔤 Key pressed: ${key}`);

    if (key === "Done") {
      this._hideKeyboard();
      return;
    }

    if (key === "Space") {
      this._handleKeyInput(" ");
      return;
    }

    if (key === "Delete") {
      this._handleDelete();
      return;
    }

    if (key === "Clear") {
      this._handleClear();
      return;
    }

    if (key.length === 1) {
      this._handleKeyInput(key);
    }
  }

  private _handleKeyInput(char: string): void {
    console.log(`📝 Adding character: "${char}"`);
    if (this.activeField === "email") {
      this.emailValue += char;
      console.log(`📧 Email value now: "${this.emailValue}"`);
      this._updateEmailDisplay();
      this._updateKeyboardDisplay();
    } else if (this.activeField === "password") {
      this.passwordValue += char;
      console.log(`🔑 Password value now: ${this.passwordValue.length} chars`);
      this._updatePasswordDisplay();
      this._updateKeyboardDisplay();
    }
  }

  private _handleDelete(): void {
    if (this.activeField === "email" && this.emailValue.length > 0) {
      this.emailValue = this.emailValue.slice(0, -1);
      this._updateEmailDisplay();
      this._updateKeyboardDisplay();
    } else if (
      this.activeField === "password" &&
      this.passwordValue.length > 0
    ) {
      this.passwordValue = this.passwordValue.slice(0, -1);
      this._updatePasswordDisplay();
      this._updateKeyboardDisplay();
    }
  }

  private _handleClear(): void {
    if (this.activeField === "email") {
      this.emailValue = "";
      this._updateEmailDisplay();
      this._updateKeyboardDisplay();
    } else if (this.activeField === "password") {
      this.passwordValue = "";
      this._updatePasswordDisplay();
      this._updateKeyboardDisplay();
    }
  }

  private _updateKeyboardDisplay(): void {
    const keyboardContainer = this.tag("KeyboardContainer");
    if (!keyboardContainer) {
      console.log("KeyboardContainer not found");
      return;
    }

    const inputCard = keyboardContainer.tag("InputDisplayCard");
    if (!inputCard) {
      console.log("InputDisplayCard not found");
      return;
    }

    // Get values
    const displayText =
      this.activeField === "email"
        ? this.emailValue || "Email address"
        : this.passwordValue.length > 0
        ? "\u2022".repeat(this.passwordValue.length)
        : "Password";

    const isPlaceholder =
      (this.activeField === "email" && this.emailValue.length === 0) ||
      (this.activeField === "password" && this.passwordValue.length === 0);

    console.log(
      `🔄 Keyboard input display: "${displayText}" (placeholder: ${isPlaceholder})`
    );
    console.log(
      `📍 InputCard: x=${inputCard.x}, y=${inputCard.y}, alpha=${inputCard.alpha}, visible=${inputCard.visible}`
    );

    // Remove old text element if it exists
    const oldInputText = inputCard.tag("InputText");
    if (oldInputText) {
      console.log("Removing old text element");
      inputCard.childList.remove(oldInputText);
    }

    // Create brand new text element with all properties explicitly set
    console.log(`✨ Creating new text element with: "${displayText}"`);
    const newText = inputCard.stage.c({
      ref: "InputText",
      x: 100,
      y: 50,
      mount: { x: 0, y: 0.5 },
      visible: true,
      alpha: 1,
      zIndex: 10,
      text: {
        text: displayText,
        fontSize: 32,
        textColor: isPlaceholder ? Colors.textSecondary : Colors.textPrimary,
        fontFace: FontFamily.Default,
      },
    });

    inputCard.childList.add(newText);
    console.log(`📝 Text element added to InputCard`);

    // Update cursor
    const cursor = inputCard.tag("Cursor");
    if (cursor) {
      if (!isPlaceholder) {
        const textLength =
          this.activeField === "email"
            ? this.emailValue.length
            : this.passwordValue.length;
        const textWidth = textLength * 25;
        cursor.patch({
          x: 100 + textWidth + 5,
          y: 30,
          alpha: 1,
        });
        console.log(`📍 Cursor positioned at x=${100 + textWidth + 5}`);
      } else {
        cursor.patch({ alpha: 0 });
      }
    }

    // Force immediate render
    this.stage.update();

    // Force another update after a frame
    setTimeout(() => {
      this.stage.update();
      console.log("✅ Keyboard display updated and rendered");
    }, 10);
  }

  private _updateEmailDisplay(): void {
    const emailContent = this.tag("EmailContent");
    if (!emailContent) return;
    const loginForm = emailContent.tag("LoginForm");
    if (!loginForm) return;
    const emailCard = loginForm.tag("EmailFieldCard");
    if (!emailCard) return;

    const inputText = emailCard.tag("InputText");
    const placeholder = emailCard.tag("Placeholder");

    if (inputText && inputText.text) {
      inputText.text.text = this.emailValue;
    }

    if (placeholder) {
      placeholder.patch({ alpha: this.emailValue.length > 0 ? 0 : 1 });
    }

    this.stage.update();
  }

  private _updatePasswordDisplay(): void {
    const emailContent = this.tag("EmailContent");
    if (!emailContent) return;
    const loginForm = emailContent.tag("LoginForm");
    if (!loginForm) return;
    const passwordCard = loginForm.tag("PasswordFieldCard");
    if (!passwordCard) return;

    const inputText = passwordCard.tag("InputText");
    const placeholder = passwordCard.tag("Placeholder");

    if (inputText && inputText.text) {
      const dots = "\u2022".repeat(this.passwordValue.length);
      inputText.text.text = dots;
    }

    if (placeholder) {
      placeholder.patch({ alpha: this.passwordValue.length > 0 ? 0 : 1 });
    }

    this.stage.update();
  }

  private async _handleLogin(): Promise<void> {
    console.log("Attempting login...");
    console.log(`📧 Email: ${this.emailValue}`);
    console.log(`🔑 Password: ${this.passwordValue.replace(/./g, "*")}`);

    if (!this.emailValue || !this.passwordValue) {
      console.error("❌ Email and password are required");
      return;
    }

    const response = await authApi.login({
      email: this.emailValue,
      password: this.passwordValue,
    });

    if (response && response.success && response.token && response.user) {
      console.log("✅ Login successful!");
      authApi.saveToken(response.token);
      this.$authenticationSuccess({
        user: response.user,
        token: response.token,
      });
    } else {
      console.error("❌ Login failed:", response?.error || "Unknown error");
    }
  }

  _getFocused(): Lightning.Component {
    if (this.showKeyboard) {
      console.log("Focus: Keyboard is open, getting keyboard component");
      const keyboardContainer = this.tag("KeyboardContainer");
      if (!keyboardContainer) {
        console.log("KeyboardContainer not found in _getFocused");
        return this;
      }
      const keyboard = keyboardContainer.tag("Keyboard");
      console.log("Keyboard component found:", !!keyboard);
      return keyboard || this;
    }

    console.log("Focus: Returning SignIn component");
    return this;
  }

  private async _generateDeviceCode(): Promise<void> {
    console.log("🔄 Generating device code...");

    const response: IDeviceCodeResponse | null =
      await authApi.generateDeviceCode();

    if (!response) {
      console.error("❌ Failed to generate device code");
      return;
    }

    this.deviceCode = response.code;
    this.qrImageUrl = response.qrCodeDataUrl;

    this._displayDeviceCode(response.code);
    this._displayQRCode(response.qrCodeDataUrl);
    this._startPolling(response.pollInterval);

    console.log(`✅ Device code generated: ${response.code}`);
  }

  private _displayDeviceCode(code: string): void {
    const qrContent = this.tag("QRCodeContent");
    if (!qrContent) return;
    const leftColumn = qrContent.tag("LeftColumn");
    if (!leftColumn) return;
    const container = leftColumn.tag("DeviceCodeContainer");
    if (!container) return;

    for (let i = 0; i < 7; i++) {
      const codeBox = container.tag(`Code${i + 1}`);
      if (codeBox) {
        const label = codeBox.tag("Label");
        if (label && label.text) {
          label.text.text = code[i] || "";
        }
      }
    }

    this.stage.update();
  }

  private _displayQRCode(dataUrl: string): void {
    const qrContent = this.tag("QRCodeContent");
    if (!qrContent) return;
    const qrCard = qrContent.tag("QRCodeCard");
    if (!qrCard) return;
    const qrContainer = qrCard.tag("QRContainer");
    if (!qrContainer) return;

    const qrImage = qrContainer.tag("QRImage");
    if (qrImage) {
      qrImage.patch({
        texture: { type: Lightning.textures.ImageTexture, src: dataUrl },
      });
    }

    this.stage.update();
  }

  private _startPolling(interval: number): void {
    this._stopPolling();

    this.pollInterval = setInterval(async () => {
      await this._checkCodeStatus();
    }, interval);

    console.log(`📡 Polling started (every ${interval}ms)`);
  }

  private _stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log("📡 Polling stopped");
    }
  }

  private async _checkCodeStatus(): Promise<void> {
    if (!this.deviceCode) return;

    const status = await authApi.checkDeviceCodeStatus(this.deviceCode);

    if (!status) return;

    if (status.status === "approved" && status.token && status.user) {
      console.log("✅ Authentication approved!");
      this._stopPolling();
      authApi.saveToken(status.token);
      this.$authenticationSuccess({ user: status.user, token: status.token });
    } else if (status.status === "expired") {
      console.log("⏰ Device code expired");
      this._stopPolling();
    }
  }
}
