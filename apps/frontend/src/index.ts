import { Launch } from "@lightningjs/sdk";
import App from "./app/App.js";
import {
  detectResolution,
  logResolutionInfo,
} from "./utils/resolution.js";
import {
  detectPlatform,
  logPlatformInfo,
  getPlatformStageConfig,
} from "./utils/platform.js";

// Step 1: Detect platform
const platform = detectPlatform();
logPlatformInfo(platform);
// Empty line for readability

// Step 2: Detect device resolution BEFORE creating the app
let resolutionConfig = detectResolution();

// Step 3: Apply platform-specific configuration if needed
const platformConfig = getPlatformStageConfig(platform);
if (platformConfig) {
  resolutionConfig = Object.assign({}, resolutionConfig, platformConfig);
}

// Step 4: Log resolution information for debugging
logResolutionInfo(resolutionConfig);
// Empty line for readability

// Step 5: Configure stage options with detected resolution
// Lightning.js creates the canvas at its natural size (1920x1080 or 1280x720)
// The canvas is NOT stretched to fill the viewport - this prevents scattering
const applicationOptions = {
  stage: {
    w: resolutionConfig.w,
    h: resolutionConfig.h,
    precision: resolutionConfig.precision,
    devicePixelRatio: resolutionConfig.devicePixelRatio,
    clearColor: 0xff0b0b0c,
    canvas: document.getElementById("app") as HTMLCanvasElement,
    useImageWorker: false,
    defaultFontFace: "Avenir Next",
  },
  debug: true,
  enablePointer: true,
  keys: {},
};

// Step 6: Launch the app with configured options
Launch(
  App,
  applicationOptions,
  {
    // Platform settings
    inspector: false,
  },
  {},
);
