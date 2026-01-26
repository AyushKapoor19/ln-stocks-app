/**
 * Platform Detection Utilities
 *
 * Detects the platform and provides platform-specific configuration
 */

import type { StageConfig } from "./resolution";

export type PlatformType =
  | "web"
  | "lg"
  | "samsung"
  | "vizio"
  | "android"
  | "firetv"
  | "comcast"
  | "unknown";

export interface PlatformInfo {
  type: PlatformType;
  name: string;
  userAgent: string;
  isTv: boolean;
}

/**
 * Detect the current platform
 */
export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent.toLowerCase();

  // LG webOS
  if (ua.includes("webos") || ua.includes("web0s")) {
    return {
      type: "lg",
      name: "LG webOS",
      userAgent: navigator.userAgent,
      isTv: true,
    };
  }

  // Samsung Tizen
  if (ua.includes("tizen") || ua.includes("samsung")) {
    return {
      type: "samsung",
      name: "Samsung Tizen",
      userAgent: navigator.userAgent,
      isTv: true,
    };
  }

  // Vizio SmartCast
  if (ua.includes("vizio")) {
    return {
      type: "vizio",
      name: "Vizio SmartCast",
      userAgent: navigator.userAgent,
      isTv: true,
    };
  }

  // Fire TV
  if (ua.includes("aftm") || ua.includes("aftn") || ua.includes("aftt")) {
    return {
      type: "firetv",
      name: "Amazon Fire TV",
      userAgent: navigator.userAgent,
      isTv: true,
    };
  }

  // Android TV (but not Fire TV)
  if (ua.includes("android") && ua.includes("tv")) {
    return {
      type: "android",
      name: "Android TV",
      userAgent: navigator.userAgent,
      isTv: true,
    };
  }

  // Comcast X1
  if (ua.includes("x1") || ua.includes("comcast")) {
    return {
      type: "comcast",
      name: "Comcast X1",
      userAgent: navigator.userAgent,
      isTv: true,
    };
  }

  // Default to web
  return {
    type: "web",
    name: "Web Browser",
    userAgent: navigator.userAgent,
    isTv: false,
  };
}

/**
 * Platform-specific stage configuration
 *
 * Some platforms need special handling for resolution detection
 */
export function getPlatformStageConfig(
  platform: PlatformInfo,
): Partial<StageConfig> | null {
  switch (platform.type) {
    case "comcast":
      // Comcast X1 sometimes reports wrong window size
      // Force detection based on actual capabilities
      if (window.innerHeight < 1080) {
        return {
          w: 1280,
          h: 720,
          precision: 2 / 3,
          devicePixelRatio: 1.5,
        };
      }
      break;

    case "samsung":
      // Samsung Tizen TVs work well with standard detection

      break;

    case "lg":
      // LG webOS works well with standard detection

      break;

    case "vizio":
      break;

    case "firetv":
    case "android":
      break;
  }

  return null;
}

/**
 * Log platform information
 */
export function logPlatformInfo(platform: PlatformInfo): void {}

/**
 * Check if running on a TV platform
 */
export function isTvPlatform(): boolean {
  return detectPlatform().isTv;
}

/**
 * Get platform type
 */
export function getPlatformType(): PlatformType {
  return detectPlatform().type;
}
