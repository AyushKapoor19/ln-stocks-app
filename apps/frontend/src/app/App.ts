import { Lightning } from "@lightningjs/sdk";
import Home from "../screens/Home";
import { ImageUtils } from "../utils/imageUtils";
import { Colors } from "../constants/Colors";

/**
 * Main App Class
 *
 * Uses coordsWidth/coordsHeight (always 1920x1080) for all UI design.
 * Lightning.js automatically scales everything based on the detected resolution.
 */
export default class App extends Lightning.Component {
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
    return this.tag("Home");
  }
}
