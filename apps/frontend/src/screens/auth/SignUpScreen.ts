/**
 * Sign Up Screen
 */

import { Lightning } from "@lightningjs/sdk";
import type { IUser } from "../../types/auth";
import BaseAuthScreen from "./BaseAuthScreen";
import MobileAuthTab from "./components/MobileAuthTab";
import EmailSignUpTab from "./components/EmailSignUpTab";

export default class SignUpScreen extends BaseAuthScreen {
  static _template(): object {
    const config = {
      title: "Create Account",
      subtitle: "Get started with your trading journey",
      mobileTabLabel: "Sign up using mobile",
      emailTabLabel: "Sign up using email",
      mobileTabWidth: 280,
      emailTabX: 350,
      emailTabWidth: 260,
    };
    return BaseAuthScreen.getBaseTemplate(config, MobileAuthTab, EmailSignUpTab, "signup");
  }

  protected getAuthConfig() {
    return {
      title: "Create Account",
      subtitle: "Get started with your trading journey",
      mobileTabLabel: "Sign up using mobile",
      emailTabLabel: "Sign up using email",
      mobileTabWidth: 280,
      emailTabX: 350,
      emailTabWidth: 260,
    };
  }

  protected getAuthType(): "signup" | "signin" {
    return "signup";
  }

  protected getMobileContentComponent(): Lightning.Component.Constructor {
    return MobileAuthTab;
  }

  protected getEmailContentComponent(): Lightning.Component.Constructor {
    return EmailSignUpTab;
  }

  _handleBack(): boolean {
    if (!this.focusOnTab) {
      this.focusOnTab = true;
      this.stage.update();
      return true;
    }

    this.fireAncestors("$navigateBack");
    return true;
  }

  $navigateToSignIn(): void {
    this.fireAncestors("$navigateToSignIn");
  }

  $authSuccess(data: { user: IUser; token: string }): void {
    this.fireAncestors("$authSuccess", data);
  }
}
