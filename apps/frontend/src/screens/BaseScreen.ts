import BaseComponent from "../components/BaseComponent";

/**
 * BaseScreen
 *
 * Base class for all screen components in the app.
 * Screens should ALWAYS fill the entire stage using coordsWidth/coordsHeight.
 *
 * All UI coordinates should be designed for 1080p (1920x1080).
 * Lightning.js will automatically scale everything based on the precision setting.
 */
export default class BaseScreen extends BaseComponent {
  /**
   * Initialize screen dimensions
   * All screens should fill the stage using design coordinates
   */
  _init(): void {
    // Set dimensions to fill the stage (using 1080p coordinates)
    this.w = this.coordsWidth; // Always 1920
    this.h = this.coordsHeight; // Always 1080
  }
}

