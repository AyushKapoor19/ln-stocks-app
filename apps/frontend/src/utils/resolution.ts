/**
 * Resolution Utilities for TV App
 *
 * Design Resolution: 1080p (1920x1080)
 * All coordinates, sizes, and fonts are designed for 1080p
 *
 * IMPORTANT: Stage dimensions remain fixed
 * - Stage is ALWAYS 1920x1080 or 1280x720 (never 3840x2160)
 * - For 4K TVs, we keep stage at 1920x1080 and let the TV OS scale it
 * - This prevents components from scattering at different resolutions
 *
 * Supported Resolutions:
 * - 720p: 1280x720 (precision = 2/3, devicePixelRatio = 1.5)
 * - 1080p: 1920x1080 (precision = 1, devicePixelRatio = 1)
 * - 4K: 1920x1080 (precision = 1, devicePixelRatio = 1) - TV OS handles scaling
 */

export interface StageConfig {
  w: number;
  h: number;
  precision: number;
  devicePixelRatio: number;
}

export interface ResolutionInfo {
  name: string;
  width: number;
  height: number;
  precision: number;
  devicePixelRatio: number;
  coordsWidth: number;
  coordsHeight: number;
}

/**
 * Design resolution constants (1080p)
 */
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

/**
 * Detect the current device resolution and return appropriate stage configuration
 * Supports platform-specific resolution hooks
 */
export function detectResolution(): StageConfig {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  console.log(`🖥️  Detected window size: ${windowWidth}x${windowHeight}`);

  // Check for URL parameters to override detection (for testing)
  // This allows testing different resolutions without changing TV settings
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has("720") || urlParams.get("resolution") === "720p") {
    console.log("🎯 Using 720p (forced via URL param)");
    return get720pConfig();
  }

  if (urlParams.has("1080") || urlParams.get("resolution") === "1080p") {
    console.log("🎯 Using 1080p (forced via URL param)");
    return get1080pConfig();
  }

  if (urlParams.has("4k") || urlParams.get("resolution") === "4k") {
    console.log("🎯 Using 4K (forced via URL param)");
    return get4KConfig();
  }

  // Auto-detect based on window size
  // Auto-detect based on window dimensions
  if (windowHeight <= 720 || windowWidth <= 1280) {
    console.log("🎯 Auto-detected: 720p");
    return get720pConfig();
  } else if (windowHeight >= 2160 || windowWidth >= 3840) {
    console.log("🎯 Auto-detected: 4K");
    return get4KConfig();
  } else {
    console.log("🎯 Auto-detected: 1080p (default)");
    return get1080pConfig();
  }
}

/**
 * Get 720p configuration
 * precision = 2/3 means the stage is scaled down from 1080p
 * devicePixelRatio = 1.5 means render at higher quality for sharper display
 */
export function get720pConfig(): StageConfig {
  return {
    w: 1280,
    h: 720,
    precision: 2 / 3,
    devicePixelRatio: 1.5,
  };
}

/**
 * Get 1080p configuration (design resolution)
 * precision = 1 means no scaling
 * devicePixelRatio = 1 means render at native resolution
 */
export function get1080pConfig(): StageConfig {
  return {
    w: 1920,
    h: 1080,
    precision: 1,
    devicePixelRatio: 1,
  };
}

/**
 * Get 4K configuration
 * IMPORTANT: We keep stage at 1920x1080 for 4K
 * and let the TV OS handle scaling
 * This prevents components from scattering!
 */
export function get4KConfig(): StageConfig {
  return {
    w: 1920,
    h: 1080,
    precision: 1,
    devicePixelRatio: 1,
  };
}

/**
 * Get human-readable resolution information
 */
export function getResolutionInfo(config: StageConfig): ResolutionInfo {
  let name = "1080p";
  if (config.h === 720) name = "720p";
  else if (config.h === 2160) name = "4K";

  return {
    name,
    width: config.w,
    height: config.h,
    precision: config.precision,
    devicePixelRatio: config.devicePixelRatio,
    coordsWidth: DESIGN_WIDTH,
    coordsHeight: DESIGN_HEIGHT,
  };
}

/**
 * Calculate scaled value based on precision
 * Use this for dynamic calculations if needed
 */
export function scaleValue(value: number, precision: number): number {
  return value * precision;
}

/**
 * Log resolution information for debugging
 */
export function logResolutionInfo(config: StageConfig): void {
  const info = getResolutionInfo(config);

  console.log("📺 TV Resolution Configuration:");
  console.log(`   Resolution: ${info.name} (${info.width}x${info.height})`);
  console.log(`   Precision: ${info.precision.toFixed(3)}`);
  console.log(`   Device Pixel Ratio: ${info.devicePixelRatio.toFixed(3)}`);
  console.log(
    `   Design Coordinates: ${info.coordsWidth}x${info.coordsHeight}`
  );
  console.log(
    `   All UI is designed for ${DESIGN_WIDTH}x${DESIGN_HEIGHT} and auto-scales`
  );
}
