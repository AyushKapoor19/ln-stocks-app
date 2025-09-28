import { Lightning } from "@lightningjs/sdk";

export default class CarouselRow extends Lightning.Component {
  private index = 0;

  static _template() {
    return {
      w: 1760,
      h: 260,
    };
  }

  private get items() {
    return this.children as Lightning.Component[];
  }

  _handleLeft() {
    if (this.items.length > 0) {
      this.index = Math.max(0, this.index - 1);
      this._reposition();
    }
  }

  _handleRight() {
    if (this.items.length > 0) {
      this.index = Math.min(this.items.length - 1, this.index + 1);
      this._reposition();
    }
  }

  _getFocused() {
    return this.items[this.index] || this;
  }

  private _reposition() {
    const cardW = 420;
    const gap = 28;
    this.setSmooth("x", -this.index * (cardW + gap), { duration: 0.3 });
  }
}
