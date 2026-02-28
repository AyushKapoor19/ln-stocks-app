/**
 * Base Email Auth Tab
 * Shared logic for email-based authentication forms
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../../../constants/Colors";
import { FontSize, FontFamily } from "../../../constants/Fonts";

export default abstract class BaseEmailAuthTab extends Lightning.Component {
  protected showKeyboard: boolean = false;
  protected isLoading: boolean = false;
  protected shakingFields: Set<string> = new Set();
  protected errorFields: Set<string> = new Set();
  protected errorGlowTimeouts: Map<string, NodeJS.Timeout> = new Map();
  protected fieldOriginalPositions: Map<string, number> = new Map();

  protected abstract getFocusOrder(): string[];
  protected abstract getFieldName(fieldType: string): string;
  protected abstract getKeyboardTitle(fieldType: string): string;
  protected abstract handleSubmit(): Promise<void>;
  protected abstract handleAlternateAction(): void;

  protected static _createInputField(
    yPos: number,
    label: string,
    placeholder: string,
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

    const focusOrder = this.getFocusOrder();
    const currentIndex = focusOrder.indexOf(
      (this as unknown as Record<string, string>).focusedElement
    );
    if (currentIndex > 0) {
      (this as unknown as Record<string, string>).focusedElement =
        focusOrder[currentIndex - 1];
      this._updateFocus();
      return true;
    }

    this.fireAncestors("$focusBackToTab");
    return true;
  }

  _handleDown(): boolean {
    if (this.showKeyboard) return false;

    const focusOrder = this.getFocusOrder();
    const currentIndex = focusOrder.indexOf(
      (this as unknown as Record<string, string>).focusedElement
    );
    if (currentIndex < focusOrder.length - 1) {
      (this as unknown as Record<string, string>).focusedElement =
        focusOrder[currentIndex + 1];
      this._updateFocus();
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
    if (this.showKeyboard) {
      const keyboardContainer = this.tag("KeyboardContainer");
      if (keyboardContainer) {
        const keyboard = keyboardContainer.tag("KeyboardComponent");
        if (keyboard) {
          return (keyboard as unknown as { _captureKey: (e: KeyboardEvent) => boolean })._captureKey(event);
        }
      }
    }
    return false;
  }

  _handleKey(event: KeyboardEvent): boolean {
    if (this.showKeyboard) {
      const keyboardContainer = this.tag("KeyboardContainer");
      if (keyboardContainer) {
        const keyboard = keyboardContainer.tag("KeyboardComponent");
        if (keyboard) {
          return (keyboard as unknown as { _handleKey: (e: KeyboardEvent) => boolean })._handleKey(event);
        }
      }
    }
    return false;
  }

  _clearAllFocus(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    this.getFocusOrder().forEach((fieldType) => {
      if (fieldType !== "signin" && fieldType !== "signup") {
        const fieldName = this.getFieldName(fieldType);
        const field = formContainer.tag(fieldName);
        if (field) {
          const focusBorder = field.tag("FocusBorder");
          if (focusBorder) {
            focusBorder.alpha = 0;
          }
        }
      }
    });

    this.stage.update();
  }

  protected _showKeyboard(): void {
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
          const focusedElement = (this as unknown as Record<string, string>).focusedElement;
          title.text.text = this.getKeyboardTitle(focusedElement);
        }
      }

      this._updateKeyboardDisplay();
    }

    this.stage.update();
  }

  protected _hideKeyboard(): void {
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

    this.stage.update();
  }

  protected _updateKeyboardDisplay(): void {
    const keyboardContainer = this.tag("KeyboardContainer");
    if (!keyboardContainer) return;

    const inputDisplay = keyboardContainer.tag("InputDisplay");
    if (!inputDisplay) return;

    const inputText = inputDisplay.tag("InputText");
    const placeholder = inputDisplay.tag("Placeholder");

    const focusedElement = (this as unknown as Record<string, string>).focusedElement;
    const fieldValue = (this as unknown as Record<string, string>)[`${focusedElement}Value`];

    if (inputText && inputText.text) {
      if (focusedElement === "password") {
        inputText.text.text = "•".repeat(fieldValue.length);
      } else {
        inputText.text.text = fieldValue;
      }
    }

    if (placeholder) {
      placeholder.setSmooth("alpha", fieldValue.length > 0 ? 0 : 1, {
        duration: 0.2,
      });
    }

    this.stage.update();
  }

  protected _updateFieldDisplay(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    this.getFocusOrder().forEach((fieldType) => {
      if (fieldType === "signin" || fieldType === "signup") return;

      const fieldName = this.getFieldName(fieldType);
      const field = formContainer.tag(fieldName);
      if (!field) return;

      const valueDisplay = field.tag("Value");
      if (valueDisplay && valueDisplay.text) {
        const fieldValue = (this as unknown as Record<string, string>)[`${fieldType}Value`];
        if (fieldValue) {
          if (fieldType === "password") {
            valueDisplay.text.text = "•".repeat(fieldValue.length);
          } else {
            valueDisplay.text.text = fieldValue;
          }
          valueDisplay.text.textColor = Colors.textPrimary;
        } else {
          const placeholderMap: Record<string, string> = {
            name: "Warren Buffett",
            email: "investor@wallstreet.com",
            password: fieldName.includes("SignUp") ? "Create a secure password" : "••••••••",
          };
          valueDisplay.text.text = placeholderMap[fieldType] || "";
          valueDisplay.text.textColor = Colors.textQuaternary;
        }
      }
    });

    this.stage.update();
  }

  protected _updateFocus(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const focusedElement = (this as unknown as Record<string, string>).focusedElement;

    this.getFocusOrder().forEach((fieldType) => {
      if (fieldType === "signin" || fieldType === "signup") {
        const buttonName = fieldType === "signin" ? "SignInButton" : "SignUpButton";
        const button = formContainer.tag(buttonName);
        if (button) {
          button.alpha = fieldType === focusedElement ? 1 : 0.7;

          const underline = button.tag("Underline");
          if (underline) {
            underline.setSmooth("alpha", fieldType === focusedElement ? 1 : 0, {
              duration: 0.2,
            });
          }
        }
      } else {
        const fieldName = this.getFieldName(fieldType);
        const field = formContainer.tag(fieldName);
        if (field) {
          const focusBorder = field.tag("FocusBorder");
          if (focusBorder) {
            focusBorder.setSmooth("alpha", fieldType === focusedElement ? 1 : 0, {
              duration: 0.2,
            });
          }
        }
      }
    });

    this.stage.update();
  }

  protected _addCharacter(char: string): void {
    const focusedElement = (this as unknown as Record<string, string>).focusedElement;
    const fieldValueKey = `${focusedElement}Value`;
    const currentValue = (this as unknown as Record<string, string>)[fieldValueKey];

    (this as unknown as Record<string, string>)[fieldValueKey] = currentValue + char;

    this._updateKeyboardDisplay();
    this._updateFieldDisplay();
    this._hideBackendError();
  }

  protected _deleteCharacter(): void {
    const focusedElement = (this as unknown as Record<string, string>).focusedElement;
    const fieldValueKey = `${focusedElement}Value`;
    const currentValue = (this as unknown as Record<string, string>)[fieldValueKey];

    if (currentValue.length > 0) {
      (this as unknown as Record<string, string>)[fieldValueKey] = currentValue.slice(
        0,
        -1,
      );
      this._updateKeyboardDisplay();
      this._updateFieldDisplay();
      this._hideBackendError();
    }
  }

  protected _clearField(): void {
    const focusedElement = (this as unknown as Record<string, string>).focusedElement;
    const fieldValueKey = `${focusedElement}Value`;

    (this as unknown as Record<string, string>)[fieldValueKey] = "";
    this._updateKeyboardDisplay();
    this._updateFieldDisplay();
    this._hideBackendError();
  }

  protected _showBackendError(message: string): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const errorMessage = formContainer.tag("BackendErrorMessage");
    if (errorMessage && errorMessage.text) {
      errorMessage.text.text = message;
      errorMessage.setSmooth("alpha", 1, { duration: 0.3 });
    }
  }

  protected _hideBackendError(): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const errorMessage = formContainer.tag("BackendErrorMessage");
    if (errorMessage) {
      errorMessage.setSmooth("alpha", 0, { duration: 0.3 });
    }
  }

  protected _shakeField(fieldName: string): void {
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

    this.shakingFields.add(fieldName);

    if (!this.fieldOriginalPositions.has(fieldName)) {
      this.fieldOriginalPositions.set(fieldName, field.x);
    }

    const originalX = this.fieldOriginalPositions.get(fieldName) || 0;

    const shakeSequence = [
      { x: originalX + 10, duration: 0.05 },
      { x: originalX - 10, duration: 0.05 },
      { x: originalX + 10, duration: 0.05 },
      { x: originalX - 10, duration: 0.05 },
      { x: originalX, duration: 0.05 },
    ];

    let currentStep = 0;

    const executeShake = (): void => {
      if (currentStep < shakeSequence.length) {
        const step = shakeSequence[currentStep];
        field.setSmooth("x", step.x, {
          duration: step.duration,
        });
        currentStep++;
        setTimeout(executeShake, step.duration * 1000);
      } else {
        this.shakingFields.delete(fieldName);
      }
    };

    executeShake();
  }

  protected _showErrorGlow(fieldName: string): void {
    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const field = formContainer.tag(fieldName);
    if (!field) return;

    this.errorFields.add(fieldName);

    const existingTimeout = this.errorGlowTimeouts.get(fieldName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    field.patch({
      color: Colors.errorFieldBackground,
    });

    const focusBorder = field.tag("FocusBorder");
    if (focusBorder) {
      focusBorder.patch({
        color: Colors.error,
      });
      focusBorder.setSmooth("alpha", 1, { duration: 0.2 });
    }

    const timeout = setTimeout(() => {
      field.patch({
        color: Colors.authInputBackground,
      });

      if (focusBorder) {
        focusBorder.patch({
          color: Colors.authAccent,
        });

        const focusedElement = (this as unknown as Record<string, string>).focusedElement;
        const currentFieldType = this.getFocusOrder().find(
          (ft) => this.getFieldName(ft) === fieldName
        );
        if (currentFieldType !== focusedElement) {
          focusBorder.setSmooth("alpha", 0, { duration: 0.2 });
        }
      }

      this.errorFields.delete(fieldName);
      this.errorGlowTimeouts.delete(fieldName);
    }, 2000);

    this.errorGlowTimeouts.set(fieldName, timeout);
  }

  protected _isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  protected _setLoadingState(loading: boolean): void {
    this.isLoading = loading;

    const formContainer = this.tag("FormContainer");
    if (!formContainer) return;

    const focusOrder = this.getFocusOrder();
    const submitButtonType = focusOrder.find((f) => f === "signin" || f === "signup");

    if (submitButtonType) {
      const buttonName = submitButtonType === "signin" ? "SignInButton" : "SignUpButton";
      const button = formContainer.tag(buttonName);

      if (button) {
        const label = button.tag("Label");
        if (label && label.text) {
          label.text.text = loading
            ? "Processing..."
            : submitButtonType === "signin"
              ? "Sign In"
              : "Create Account";
        }
        button.alpha = loading ? 0.5 : 0.7;
      }
    }

    this.stage.update();
  }

  $keyboardInput(data: { action: string; value?: string }): void {
    if (data.action === "char" && data.value) {
      this._addCharacter(data.value);
    } else if (data.action === "delete") {
      this._deleteCharacter();
    } else if (data.action === "clear") {
      this._clearField();
    } else if (data.action === "done") {
      this._hideKeyboard();
    }
  }
}
