import { Lightning } from "@lightningjs/sdk";

export default class StockCard extends Lightning.Component {
  private data: any;

  static _template() {
    return {
      w: 420,
      h: 260,
      rect: true,
      color: 0xff151518,
      rtt: true,
      Wrapper: {
        Logo: {
          x: 20,
          y: 18,
          w: 56,
          h: 56,
          rect: true,
          color: 0xffffffff,
          alpha: 0.85,
        },
        Symbol: {
          x: 88,
          y: 20,
          text: { text: "", fontSize: 34, textColor: 0xffffffff },
        },
        Price: {
          x: 88,
          y: 66,
          text: { text: "", fontSize: 26, textColor: 0xffffffff },
        },
        Change: {
          x: 20,
          y: 200,
          text: { text: "", fontSize: 26, textColor: 0xff00d27a },
        },
      },
    } as any;
  }

  set content(v: any) {
    console.log("StockCard receiving content:", v);
    this.data = v;
    this._update();
  }
  _focus() {
    this.setSmooth("scale", 1.06, { duration: 0.25 });
  }
  _unfocus() {
    this.setSmooth("scale", 1.0, { duration: 0.18 });
  }

  private _update() {
    if (!this.data) return;
    console.log("StockCard updating with:", this.data);
    const { symbol, quote } = this.data;
    const pct = (quote.changePct * 100).toFixed(2);
    const col = quote.changePct >= 0 ? 0xff00d27a : 0xffff4d4f;

    this.patch({
      Wrapper: {
        Symbol: { text: { text: symbol } },
        Price: { text: { text: `$${quote.price.toFixed(2)}` } },
        Change: {
          text: { text: `${quote.changePct >= 0 ? "+" : ""}${pct}%` },
          textColor: col,
        },
      },
    });

    console.log("StockCard patched successfully");
  }
}
