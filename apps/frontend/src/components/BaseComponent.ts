import { Lightning } from "@lightningjs/sdk";

/**
 * BaseComponent
 *
 * Base class for all Lightning components in the app.
 * Components inherit from this to ensure proper responsive behavior.
 *
 * Key Features:
 * - Access to coordsWidth/coordsHeight (always 1920x1080)
 * - Access to precision for manual scaling if needed
 * - Helper methods for responsive calculations
 * - Consistent pattern across all components
 */
export default class BaseComponent extends Lightning.Component {
  /**
   * Get the design coordinate width (always 1920)
   * Lightning.js automatically computes this based on stage.w and precision
   */
  get coordsWidth(): number {
    return this.stage.coordsWidth;
  }

  /**
   * Get the design coordinate height (always 1080)
   * Lightning.js automatically computes this based on stage.h and precision
   */
  get coordsHeight(): number {
    return this.stage.coordsHeight;
  }

  /**
   * Get the current precision factor
   * 720p: 2/3, 1080p: 1, 4K: 2
   */
  get precision(): number {
    return this.stage.getOption("precision") || 1;
  }

  /**
   * Get the actual stage width (varies by resolution)
   */
  get actualWidth(): number {
    return this.stage.w;
  }

  /**
   * Get the actual stage height (varies by resolution)
   */
  get actualHeight(): number {
    return this.stage.h;
  }

  /**
   * Get the final width of the component with precision applied
   * Useful for calculating positions based on actual rendered size
   */
  getWidth(): number {
    return this.finalW * (this.stage.getOption("precision") || 1);
  }

  /**
   * Get the final height of the component with precision applied
   * Useful for calculating positions based on actual rendered size
   */
  getHeight(): number {
    return this.finalH * (this.stage.getOption("precision") || 1);
  }

  /**
   * Get a static value from the class definition
   * Useful in templates for accessing class properties
   *
   * @example
   * static width = 400;
   * // In template:
   * w: this.staticValue('width')
   */
  static staticValue<T = number>(attribute: string): T {
    return (this as unknown as Record<string, T>)[attribute];
  }

  /**
   * Get a static value from the instance's class
   *
   * @example
   * this.staticValue('width') // Gets MyCard.width
   */
  staticValue<T = number>(attribute: string): T {
    return (this.constructor as unknown as Record<string, T>)[attribute];
  }
}
