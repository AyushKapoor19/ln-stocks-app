import { Lightning } from "@lightningjs/sdk";

export default class WatchlistCard extends Lightning.Component {
  private _stockData: {
    symbol: string;
    price: number;
    changePct: number;
    series: number[];
  } | null = null;

  static _template() {
    return {
      w: 450,
      h: 80,
      rect: true,
      color: 0x11ffffff, // Semi-transparent background
      shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },

      Symbol: {
        x: 20,
        y: 15,
        text: {
          text: "",
          fontFace: "Arial",
          fontSize: 24,
          fontWeight: 600,
          textColor: 0xffffffff,
        },
      },
      Price: {
        x: 350,
        y: 15,
        mount: 1, // Right align
        text: {
          text: "",
          fontFace: "Arial",
          fontSize: 24,
          fontWeight: 500,
          textColor: 0xffffffff,
        },
      },
      Change: {
        x: 350,
        y: 45,
        mount: 1, // Right align
        text: {
          text: "",
          fontFace: "Arial",
          fontSize: 16,
          fontWeight: 500,
          textColor: 0xff00d27a,
        },
      },
      MiniChart: {
        x: 20,
        y: 45,
        w: 200,
        h: 20,
        rect: true,
        color: 0x2200d4ff, // Semi-transparent teal background
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },

        ChartLine: {
          x: 10,
          y: 10,
          w: 180,
          h: 2,
          rect: true,
          color: 0xff00d4ff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 1 },
        },
      },
    };
  }

  set stockData(data: typeof this._stockData) {
    this._stockData = data;
    if (data) {
      this._render();
    }
  }

  private _render() {
    if (!this._stockData) return;

    const { symbol, price, changePct, series } = this._stockData;
    const isPositive = changePct >= 0;

    // Update text elements
    this.tag("Symbol")!.text.text = symbol;
    this.tag("Price")!.text.text = price.toFixed(2);

    const changeText = `${isPositive ? "+" : ""}${(changePct * 100).toFixed(
      2
    )}%`;
    this.tag("Change")!.text.text = changeText;
    this.tag("Change")!.text.textColor = isPositive ? 0xff00d27a : 0xffff4757;

    // Update mini chart color
    const chartBg = this.tag("MiniChart");
    const chartLine = this.tag("MiniChart")?.tag("ChartLine");

    if (chartBg && chartLine) {
      const chartColor = isPositive ? 0xff00d27a : 0xffff4757;
      const bgColor = isPositive ? 0x2200d27a : 0x22ff4757;

      chartBg.color = bgColor;
      chartLine.color = chartColor;

      // Animate chart line based on trend
      if (series && series.length > 0) {
        const trend = series[series.length - 1] - series[0];
        const width = trend > 0 ? 180 : 160;
        chartLine.setSmooth("w", width, { duration: 1 });
      }
    }

    // Add entrance animation
    this.setSmooth("alpha", 1, { duration: 0.6 });
    this.setSmooth("scale", 1, { duration: 0.8, delay: 0.1 });
  }

  _focus() {
    // Subtle focus effect
    this.setSmooth("scale", 1.05, { duration: 0.3 });
    this.setSmooth("color", 0x22ffffff, { duration: 0.3 });
  }

  _unfocus() {
    this.setSmooth("scale", 1, { duration: 0.3 });
    this.setSmooth("color", 0x11ffffff, { duration: 0.3 });
  }
}
