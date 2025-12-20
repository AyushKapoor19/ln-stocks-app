/**
 * Stage Configuration for Lightning.js
 *
 * Simplified configuration for browser-based deployment
 * Design Resolution: 1080p (1920x1080)
 */

export interface StageConfig {
  w: number;
  h: number;
  precision: number;
  devicePixelRatio: number;
}

/**
 * Design resolution constants (1080p)
 */
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

/**
 * Get stage configuration based on window size
 * Simplified for browser deployment
 */
export function getStageConfig(): StageConfig {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  console.log(`Window size: ${windowWidth}x${windowHeight}`);

  // Default to 1080p design
  const config: StageConfig = {
    w: DESIGN_WIDTH,
    h: DESIGN_HEIGHT,
    precision: 1,
    devicePixelRatio: 1,
  };

  console.log(`✅ Stage: ${config.w}x${config.h} (precision: ${config.precision})`);
  return config;
}

