import { Launch } from "@lightningjs/sdk";
import App from "./app/App.js";
import { detectResolution } from "./utils/resolution.js";

const resolutionConfig = detectResolution();

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

Launch(App, applicationOptions, { inspector: false }, {});
