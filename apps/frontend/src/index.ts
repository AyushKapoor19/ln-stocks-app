import { Launch } from "@lightningjs/sdk";
import App from "./app/App.js";

console.log("Starting Lightning Stocks App...");

Launch(
  App,
  {
    stage: {
      w: 1920,
      h: 1080,
      clearColor: 0xff0b0b0c,
      canvas: document.getElementById("app") as HTMLCanvasElement,
      useImageWorker: false,
      defaultFontFace: "Avenir Next",
    },
    debug: true,
    keys: {
      8: "Back",
      13: "Enter",
      27: "Menu",
      37: "Left",
      38: "Up",
      39: "Right",
      40: "Down",
    },
    enablePointer: true,
  },
  {
    // Platform settings
    inspector: false,
  },
  {}
);
