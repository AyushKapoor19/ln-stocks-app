// Set up required globals before importing Lightning JS
if (typeof window !== "undefined") {
  (window as any).lng = (window as any).lng || {};
  (window as any).lng.Utils = (window as any).lng.Utils || {};
  (window as any).lng.Utils.asset =
    (window as any).lng.Utils.asset || ((path: string) => path);
}

import { Launch, Lightning } from "@lightningjs/sdk";

class App extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xff0b0b0c,

      TestText: {
        x: 960,
        y: 540,
        mount: 0.5,
        text: {
          text: "🚀 Lightning Stocks TV",
          fontFace: "Arial",
          fontSize: 64,
          textColor: 0xffffffff,
        },
      },
    };
  }

  static getFonts() {
    return [];
  }
}

Launch(App);
