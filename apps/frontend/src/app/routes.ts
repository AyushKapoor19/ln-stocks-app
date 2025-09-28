import Home from "../screens/Home.js";
import Detail from "../screens/Detail.js";
import ZenMode from "../screens/ZenMode.js";

export default {
  boot: () => Promise.resolve(),
  root: "home",
  routes: {
    home: {
      path: "home",
      component: Home,
    },
    "stock/:symbol": {
      path: "stock/:symbol",
      component: Detail,
    },
    zen: {
      path: "zen",
      component: ZenMode,
    },
  },
};
