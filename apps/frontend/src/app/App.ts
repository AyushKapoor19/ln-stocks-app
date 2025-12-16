import { Lightning } from "@lightningjs/sdk";
import Home from "../screens/Home";
import SignUpScreen from "../screens/auth/SignUpScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import AccountScreen from "../screens/auth/AccountScreen";
import { ImageUtils } from "../utils/imageUtils";
import { Colors } from "../constants/Colors";
import { authApi } from "../services/authApi";

interface IUser {
  id: number;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

/**
 * Main App Class
 *
 * Uses coordsWidth/coordsHeight (always 1920x1080) for all UI design.
 * Lightning.js automatically scales everything based on the detected resolution.
 */
export default class App extends Lightning.Component {
  private currentScreen: string = "Home";
  private currentUser: IUser | null = null;

  static getFonts(): object[] {
    return [];
  }

  static _template(): object {
    return {
      // Use dynamic functions to get design coordinates
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.background,
      Home: {
        type: Home,
        alpha: 1,
        zIndex: 1,
        visible: true,
      },
      SignUpScreen: {
        type: SignUpScreen,
        alpha: 0,
        zIndex: 2,
        visible: false,
      },
      SignInScreen: {
        type: SignInScreen,
        alpha: 0,
        zIndex: 2,
        visible: false,
      },
      AccountScreen: {
        type: AccountScreen,
        alpha: 0,
        zIndex: 2,
        visible: false,
      },
    };
  }

  _init(): void {
    // Set width using Lightning.js coordsWidth
    this.w = this.stage.coordsWidth;

    // Initialize ImageUtils with current precision
    const precision = this.stage.getOption('precision') as number || 1;
    ImageUtils.setScaleFactor(precision);

    console.log(
      `📱 App initialized with design coordinates: ${this.w}x${this.stage.coordsHeight}`
    );
    console.log(`   Stage size: ${this.stage.w}x${this.stage.h}`);
    console.log(`   Precision: ${precision}`);

    // Check for stored auth token and auto-login
    void this._checkStoredAuth();
  }

  private async _checkStoredAuth(): Promise<void> {
    const token = authApi.getToken();
    
    if (!token) {
      console.log("📭 No stored auth token found");
      return;
    }

    console.log("🔑 Found stored token, verifying...");
    
    const response = await authApi.verifyToken(token);
    
    if (response.success && response.user) {
      console.log("✅ Auto-login successful!", response.user);
      this.currentUser = response.user as IUser;
      
      // Update AccountScreen with user data
      const accountScreen = this.tag("AccountScreen") as AccountScreen;
      if (accountScreen && accountScreen.setUser) {
        accountScreen.setUser(this.currentUser);
      }
      
      // Update Home screen to show "Account" instead of "Sign In"
      const homeScreen = this.tag("Home");
      if (homeScreen && (homeScreen as any).updateAuthButton) {
        (homeScreen as any).updateAuthButton(true);
      }
    } else {
      console.log("❌ Token verification failed, clearing token");
      authApi.clearToken();
    }
  }

  _getFocused(): Lightning.Component | null {
    return this.tag(this.currentScreen);
  }

  $showAuthFlow(): void {
    // Called from Home button - decides between SignUp/SignIn/Account
    if (this.currentUser) {
      console.log("📱 Navigating to Account screen (user logged in)");
      this._showScreen("AccountScreen");
    } else {
      console.log("📱 Navigating to Sign Up screen (default for new users)");
      this._showScreen("SignUpScreen");
    }
  }

  $navigateToSignIn(): void {
    console.log("📱 Navigating to Sign In screen");
    this._showScreen("SignInScreen");
  }

  $navigateToSignUp(): void {
    console.log("📱 Navigating to Sign Up screen");
    this._showScreen("SignUpScreen");
  }

  $navigateToHome(): void {
    console.log("📱 Navigating to Home");
    this._showScreen("Home");
  }

  $navigateBack(): void {
    console.log("📱 Navigating back to Home");
    this._showScreen("Home");
  }

  $authSuccess(data: { user: IUser; token: string }): void {
    console.log("✅ Authentication successful!", data.user);
    this.currentUser = data.user;
    
    // Save token for persistence
    authApi.saveToken(data.token);
    
    // Update AccountScreen with user data
    const accountScreen = this.tag("AccountScreen") as AccountScreen;
    if (accountScreen && accountScreen.setUser) {
      accountScreen.setUser(data.user);
    }
    
    // Update Home screen to show "Account" button
    const homeScreen = this.tag("Home");
    if (homeScreen && (homeScreen as any).updateAuthButton) {
      (homeScreen as any).updateAuthButton(true);
    }
    
    // Navigate to Account screen
    this._showScreen("AccountScreen");
  }

  $signOut(): void {
    console.log("🚪 User signed out");
    this.currentUser = null;
    authApi.clearToken();
    
    // Update Home screen to show "Sign In" instead of "Account"
    const homeScreen = this.tag("Home");
    if (homeScreen && (homeScreen as any).updateAuthButton) {
      (homeScreen as any).updateAuthButton(false);
    }
    
    this._showScreen("Home");
  }

  private _showScreen(screenName: string): void {
    const screens = ["Home", "SignUpScreen", "SignInScreen", "AccountScreen"];
    
    screens.forEach((screen) => {
      const screenComponent = this.tag(screen);
      if (screenComponent) {
        if (screen === screenName) {
          screenComponent.visible = true;
          screenComponent.setSmooth("alpha", 1, { duration: 0.3 });
          screenComponent.zIndex = 10;
          if (screenComponent._attach) {
            screenComponent._attach();
          }
        } else {
          if (screenComponent._detach) {
            screenComponent._detach();
          }
          screenComponent.setSmooth("alpha", 0, { duration: 0.3 });
          screenComponent.zIndex = 1;
          setTimeout(() => {
            if (this.currentScreen !== screen) {
              screenComponent.visible = false;
            }
          }, 300);
        }
      }
    });

    this.currentScreen = screenName;
    this.stage.update();
  }
}
