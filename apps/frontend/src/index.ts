import { Launch } from "@lightningjs/sdk";
import App from "./app/App.js";
import { detectResolution } from "./utils/resolution.js";
import { Colors } from "./constants/Colors.js";

const resolutionConfig = detectResolution();

const applicationOptions = {
  stage: {
    w: resolutionConfig.w,
    h: resolutionConfig.h,
    precision: resolutionConfig.precision,
    devicePixelRatio: resolutionConfig.devicePixelRatio,
    clearColor: Colors.stageClearColor,
    canvas: document.getElementById("app") as HTMLCanvasElement,
    useImageWorker: false,
    defaultFontFace: "Avenir Next",
  },
  debug: true,
  enablePointer: true,
  keys: {},
};

Launch(App, applicationOptions, {});
