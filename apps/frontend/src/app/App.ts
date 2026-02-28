import { Lightning } from "@lightningjs/sdk";
import Home from "../screens/Home";
import SignUpScreen from "../screens/auth/SignUpScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import AccountScreen from "../screens/auth/AccountScreen";
import SearchScreen from "../screens/SearchScreen";
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

interface IHomeScreen extends Lightning.Component {
  updateAuthButton?: (isLoggedIn: boolean) => void;
  loadStockFromSearch?: (symbol: string, name: string) => void;
}

/**
 * Main App Class
 *
 * Uses coordsWidth/coordsHeight (always 1920x1080) for all UI design.
 * Lightning.js automatically scales everything based on the detected resolution.
 */
export default class App extends Lightning.Component {
  private static readonly SCREENS = [
    "Home",
    "SignUpScreen",
    "SignInScreen",
    "AccountScreen",
    "SearchScreen",
  ] as const;

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
      SearchScreen: {
        type: SearchScreen,
        alpha: 0,
        zIndex: 3,
        visible: false,
      },
    };
  }

  _init(): void {
    // Set width using Lightning.js coordsWidth
    this.w = this.stage.coordsWidth;

    const precision = (this.stage.getOption("precision") as number) || 1;

    // Check for stored auth token and auto-login
    void this._checkStoredAuth();
  }

  private async _checkStoredAuth(): Promise<void> {
    const token = authApi.getToken();

    if (!token) {
      return;
    }

    const response = await authApi.verifyToken(token);

    if (response.success && response.user) {
      this.currentUser = response.user as IUser;

      // Update AccountScreen with user data
      const accountScreen = this.tag("AccountScreen") as AccountScreen;
      if (accountScreen && accountScreen.setUser) {
        accountScreen.setUser(this.currentUser);
      }

      // Update Home screen to show "Account" instead of "Sign In"
      this._updateHomeAuthButton(true);
    } else {
      authApi.clearToken();
    }
  }

  _getFocused(): Lightning.Component | null {
    return this.tag(this.currentScreen);
  }

  private _updateHomeAuthButton(isLoggedIn: boolean): void {
    const homeScreen = this.tag("Home") as IHomeScreen;
    if (homeScreen?.updateAuthButton) {
      homeScreen.updateAuthButton(isLoggedIn);
    }
  }

  $showAuthFlow(): void {
    // Called from Home button - decides between SignUp/SignIn/Account
    if (this.currentUser) {
      this._showScreen("AccountScreen");
    } else {
      this._showScreen("SignUpScreen");
    }
  }

  $navigateToSignIn(): void {
    this._showScreen("SignInScreen");
  }

  $navigateToSignUp(): void {
    this._showScreen("SignUpScreen");
  }

  $navigateToHome(): void {
    this._showScreen("Home");
  }

  $navigateBack(): void {
    this._showScreen("Home");
  }

  $authSuccess(data: { user: IUser; token: string }): void {
    this.currentUser = data.user;

    // Save token for persistence
    authApi.saveToken(data.token);

    // Update AccountScreen with user data
    const accountScreen = this.tag("AccountScreen") as AccountScreen;
    if (accountScreen && accountScreen.setUser) {
      accountScreen.setUser(data.user);
    }

    // Update Home screen to show "Account" button
    this._updateHomeAuthButton(true);

    // Navigate to Account screen
    this._showScreen("AccountScreen");
  }

  $signOut(): void {
    this.currentUser = null;
    authApi.clearToken();

    // Update Home screen to show "Sign In" instead of "Account"
    this._updateHomeAuthButton(false);

    this._showScreen("Home");
  }

  $openSearch(): void {
    this._showScreen("SearchScreen");
  }

  $closeSearch(): void {
    this._showScreen("Home");
  }

  $selectStockFromSearch(data: { symbol: string; name: string }): void {
    // Pass the selected stock to Home screen
    const homeScreen = this.tag("Home") as IHomeScreen;
    if (homeScreen?.loadStockFromSearch) {
      homeScreen.loadStockFromSearch(data.symbol, data.name);
    }
  }

  private _showScreen(screenName: string): void {
    App.SCREENS.forEach((screen) => {
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
