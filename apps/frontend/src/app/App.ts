import { Lightning } from "@lightningjs/sdk";
import Home from "../screens/Home";

export default class App extends Lightning.Component {
  static getFonts(): object[] {
    return [];
  }

  static _template(): object {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: 0xff000000, // Pure black background
      Home: {
        type: Home,
      },
    };
  }

  _getFocused(): Lightning.Component | null {
    return this.tag("Home");
  }
}
