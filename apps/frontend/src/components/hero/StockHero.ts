import { Lightning } from "@lightningjs/sdk";
import BeautifulChart from "../charts/BeautifulChart";

export default class StockHero extends Lightning.Component {
  private _data: {
    symbol: string;
    name?: string;
    price: number;
    changePct: number;
    series: number[];
  } | null = null;

  static _template() {
    return {
      w: 1920,
      h: 520,
      rect: true,
      color: 0xff0f0f11,
      alpha: 0.95,
      Title: {
        x: 80,
        y: 64,
        text: { text: "", fontSize: 64, textColor: 0xffffffff },
      },
      Price: {
        x: 80,
        y: 150,
        text: { text: "", fontSize: 96, textColor: 0xffffffff },
      },
      Change: {
        x: 420,
        y: 190,
        text: { text: "", fontSize: 42, textColor: 0xff00d27a },
      },
      Chart: {
        x: 0,
        y: 0,
        w: 1920,
        h: 520,
        type: BeautifulChart,
        alpha: 1,
      },
    };
  }

  set content(v: StockHero["_data"]) {
    this._data = v;
    if (this._data) {
      this._render();
    }
  }

  private _render() {
    if (!this._data) return;
    const { symbol, name, price, changePct, series } = this._data;

    // Determine colors based on performance (TradingView style)
    const isPositive = changePct >= 0;
    const changeColor = isPositive ? 0xff00d27a : 0xfff23645;
    const chartColor = isPositive ? "#00d27a" : "#f23645";

    this.patch({
      Title: {
        text: { text: name ?? symbol },
        alpha: 0,
      },
      Price: {
        text: { text: `$${price.toFixed(2)}` },
        alpha: 0,
      },
      Change: {
        text: {
          text: `${changePct >= 0 ? "+" : ""}${(changePct * 100).toFixed(2)}%`,
          textColor: changeColor,
        },
        alpha: 0,
      },
    });

    // Animate text elements in sequence
    setTimeout(() => {
      this.tag("Title")?.setSmooth("alpha", 1, { duration: 0.8, delay: 0.1 });
      this.tag("Price")?.setSmooth("alpha", 1, { duration: 0.8, delay: 0.3 });
      this.tag("Change")?.setSmooth("alpha", 1, { duration: 0.8, delay: 0.5 });
    }, 100);

    // Set up professional TradingView chart
    const chartComponent = this.tag("Chart");
    if (chartComponent && series && series.length > 0) {
      // Set the line color based on performance
      chartComponent.lineColor = chartColor;
      // Set points for beautiful animated chart
      chartComponent.points = series;
    }
  }
}
