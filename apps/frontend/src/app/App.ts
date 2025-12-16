import { Lightning } from "@lightningjs/sdk";
import Home from "../screens/Home";
import SignUpScreen from "../screens/auth/SignUpScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import { ImageUtils } from "../utils/imageUtils";
import { Colors } from "../constants/Colors";

/**
 * Main App Class
 *
 * Uses coordsWidth/coordsHeight (always 1920x1080) for all UI design.
 * Lightning.js automatically scales everything based on the detected resolution.
 */
export default class App extends Lightning.Component {
  private currentScreen: string = "Home";

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
  }

  _getFocused(): Lightning.Component | null {
    return this.tag(this.currentScreen);
  }

  $navigateToSignIn(): void {
    console.log("📱 Navigating to Sign In screen");
    this._showScreen("SignInScreen");
  }

  $navigateToSignUp(): void {
    console.log("📱 Navigating to Sign Up screen");
    this._showScreen("SignUpScreen");
  }

  $navigateBack(): void {
    console.log("📱 Navigating back to Home");
    this._showScreen("Home");
  }

  $authenticationSuccess(data: { user: unknown; token: string }): void {
    console.log("✅ Authentication successful!");
    this._showScreen("Home");
  }

  private _showScreen(screenName: string): void {
    const screens = ["Home", "SignUpScreen", "SignInScreen"];
    
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
