/**
 * Sign In Screen
 */

import { Lightning } from "@lightningjs/sdk";
import BaseAuthScreen from "./BaseAuthScreen";
import MobileAuthTab from "./components/MobileAuthTab";
import EmailSignInTab from "./components/EmailSignInTab";

export default class SignInScreen extends BaseAuthScreen {
  protected getAuthConfig() {
    return {
      title: "Welcome Back",
      subtitle: "Sign in to continue trading",
      mobileTabLabel: "Sign in using mobile",
      emailTabLabel: "Sign in using email",
      mobileTabWidth: 260,
      emailTabX: 330,
      emailTabWidth: 240,
    };
  }

  protected getMobileContentComponent(): Lightning.Component.Constructor {
    return MobileAuthTab;
  }

  protected getEmailContentComponent(): Lightning.Component.Constructor {
    return EmailSignInTab;
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

  $navigateToSignUp(): void {
    this.fireAncestors("$navigateToSignUp");
  }

  $authSuccess(data: { user: unknown; token: string }): void {
    this.fireAncestors("$authSuccess", data);
  }
}
