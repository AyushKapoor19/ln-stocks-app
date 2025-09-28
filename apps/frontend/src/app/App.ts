import { Lightning } from "@lightningjs/sdk";
import Home from "../screens/Home.js";

export default class App extends Lightning.Component {
  static getFonts() {
    return [];
  }

  static _template() {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: 0xff0b0b0c,
      Home: {
        type: Home,
      },
    };
  }

  _getFocused() {
    return this.tag("Home");
  }
}
