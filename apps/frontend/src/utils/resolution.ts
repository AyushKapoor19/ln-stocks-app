/**
 * Resolution Utilities
 *
 * Stage is fixed at 1920x1080 or 1280x720
 * 4K displays use 1080p stage with OS-level scaling
 */

import type { IResolutionInfo } from "../types/stage";

export interface StageConfig {
  w: number;
  h: number;
  precision: number;
  devicePixelRatio: number;
}

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

export function detectResolution(): StageConfig {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has("720") || urlParams.get("resolution") === "720p") {
    return get720pConfig();
  }

  if (urlParams.has("1080") || urlParams.get("resolution") === "1080p") {
    return get1080pConfig();
  }

  if (urlParams.has("4k") || urlParams.get("resolution") === "4k") {
    return get4KConfig();
  }

  if (windowHeight <= 720 || windowWidth <= 1280) {
    return get720pConfig();
  } else if (windowHeight >= 2160 || windowWidth >= 3840) {
    return get4KConfig();
  } else {
    return get1080pConfig();
  }
}

export function get720pConfig(): StageConfig {
  return {
    w: 1280,
    h: 720,
    precision: 2 / 3,
    devicePixelRatio: 1.5,
  };
}

export function get1080pConfig(): StageConfig {
  return {
    w: 1920,
    h: 1080,
    precision: 1,
    devicePixelRatio: 1,
  };
}

export function get4KConfig(): StageConfig {
  return {
    w: 1920,
    h: 1080,
    precision: 1,
    devicePixelRatio: 1,
  };
}

export function getResolutionInfo(config: StageConfig): IResolutionInfo {
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

export function scaleValue(value: number, precision: number): number {
  return value * precision;
}
