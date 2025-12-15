/**
 * Image Utilities
 *
 * Handles image scaling based on stage precision for responsive design.
 */

export interface ITransformsOptions {
  w?: number;
  h?: number;
  q?: number;
  c?: string;
  g?: string;
  f?: string;
}

export class ImageUtils {
  private static _scaleFactor: number = 1;

  /**
   * Set the scale factor based on stage precision
   * Call this from App._init() with stage.precision value
   */
  static setScaleFactor(scaleBy: number): void {
    this._scaleFactor = scaleBy;
  }

  /**
   * Get scaled image URL with transformations
   * Automatically scales width/height based on current precision
   *
   * @param imageUrl - Base image URL
   * @param options - Transform options (w, h, q, c, g, f)
   * @returns Transformed image URL with query parameters
   */
  static getImage(
    imageUrl: string = "",
    options: ITransformsOptions = {}
  ): string {
    // Strip existing query params and hash
    const strippedUrl = imageUrl.split("#")[0].split("?")[0];
    const queryParams: string[] = [];

    // Scale dimensions by precision factor
    if (options.w) {
      queryParams.push("w_" + Math.round(options.w * this._scaleFactor));
    }
    if (options.h) {
      queryParams.push("h_" + Math.round(options.h * this._scaleFactor));
    }

    // Add other transformations
    if (options.q) {
      queryParams.push("q_" + options.q);
    }
    if (options.c) {
      queryParams.push("c_" + options.c);
    }
    if (options.g) {
      queryParams.push("g_" + options.g);
    }
    if (options.f) {
      queryParams.push("f_" + options.f);
    }

    // Build query string
    const params = queryParams.length ? `?q=${queryParams.join(",")}` : "";
    return strippedUrl + params;
  }

  /**
   * Get current scale factor
   */
  static getScaleFactor(): number {
    return this._scaleFactor;
  }

  /**
   * Calculate scaled dimension
   * Useful for manual calculations
   */
  static scale(value: number): number {
    return Math.round(value * this._scaleFactor);
  }
}
