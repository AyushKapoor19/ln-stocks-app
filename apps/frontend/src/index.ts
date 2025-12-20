import { Launch } from "@lightningjs/sdk";
import App from "./app/App.js";
import {
  detectResolution,
  logResolutionInfo,
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
} from "./utils/resolution.js";
import {
  detectPlatform,
  logPlatformInfo,
  getPlatformStageConfig,
} from "./utils/platform.js";

console.log("Starting Lightning Stocks App...");

// Step 1: Detect platform
const platform = detectPlatform();
logPlatformInfo(platform);
console.log(""); // Empty line for readability

// Step 2: Detect device resolution BEFORE creating the app
let resolutionConfig = detectResolution();

// Step 3: Apply platform-specific configuration if needed
const platformConfig = getPlatformStageConfig(platform);
if (platformConfig) {
  resolutionConfig = Object.assign({}, resolutionConfig, platformConfig);
  console.log("✓ Applied platform-specific configuration\n");
}

// Step 4: Log resolution information for debugging
logResolutionInfo(resolutionConfig);
console.log(""); // Empty line for readability

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

console.log("✅ Application configured successfully");
console.log(
  "   Stage Resolution: " +
    resolutionConfig.w +
    "x" +
    resolutionConfig.h +
    " (FIXED)"
);
console.log("   Precision: " + resolutionConfig.precision.toFixed(3));
console.log("   Canvas: Natural size (NO viewport stretching)\n");

// Step 6: Launch the app with configured options
Launch(
  App,
  applicationOptions,
  {
    // Platform settings
    inspector: false,
  },
  {}
);

console.log("App launched successfully!\n");
