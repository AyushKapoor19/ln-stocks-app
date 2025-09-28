// apps/frontend/src/components/charts/Sparkline.ts
import { Lightning } from "@lightningjs/sdk";

export default class AnimatedSparkline extends Lightning.Component {
  private pts: number[] = [];
  private _progress = 0;
  private stroke = "#E6E6E6";

  static _template() {
    return {
      w: 1000,
      h: 200,
      rect: true,
      color: 0x22ff0000, // Semi-transparent red background for debugging
    };
  }

  _init() {
    // Initial draw with default data if points were set before component was ready
    if (this.pts.length > 0) {
      this._draw();
      this.setSmooth("_progress", 1, { duration: 0.4 });
    }
  }

  set points(p: number[]) {
    this.pts = Array.isArray(p) ? p : [];
    this._progress = 0;

    // Draw immediately since we're applying to component directly
    this._draw();
    this.setSmooth("_progress", 1, { duration: 0.4 });
  }

  set progress(v: number) {
    this._progress = v;
    this._draw();
  }

  get progress() {
    return this._progress;
  }

  set lineColor(c: string) {
    this.stroke = c || this.stroke;
    this._draw();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace("#", "");

    // Default to white if invalid
    if (hex.length !== 6) {
      return { r: 255, g: 255, b: 255 };
    }

    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    return { r, g, b };
  }

  private _draw() {
    const w = this.w as number;
    const h = this.h as number;
    const pts = this.pts.length ? this.pts : [1, 1, 1];

    // downsample for performance
    const step = Math.max(1, Math.floor(pts.length / 120));
    const ds = pts.filter((_, i) => i % step === 0);

    const min = Math.min(...ds);
    const max = Math.max(...ds);
    const range = Math.max(1e-6, max - min);
    const count = Math.max(2, Math.floor(this._progress * ds.length));

    // Create canvas texture manually since Lightning API is unclear
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);

    const X = (i: number) => (i / Math.max(1, ds.length - 1)) * w;
    const Y = (v: number) => h - ((v - min) / range) * (h * 0.8) - h * 0.1; // Add padding

    // Create dynamic gradient based on line color
    const baseColor = this.stroke;
    const rgb = this.hexToRgb(baseColor);

    // Fill gradient with dynamic color
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`);
    grad.addColorStop(0.6, `rgba(${rgb.r},${rgb.g},${rgb.b},0.1)`);
    grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.0)`);

    ctx.beginPath();
    ctx.moveTo(X(0), Y(ds[0]));

    // Use smooth curves instead of straight lines
    for (let i = 1; i < count; i++) {
      if (i === 1) {
        ctx.lineTo(X(i), Y(ds[i]));
      } else {
        const xc = (X(i - 1) + X(i)) / 2;
        const yc = (Y(ds[i - 1]) + Y(ds[i])) / 2;
        ctx.quadraticCurveTo(X(i - 1), Y(ds[i - 1]), xc, yc);
      }
    }

    // Complete the area fill
    if (count > 1) {
      ctx.lineTo(X(count - 1), Y(ds[count - 1]));
    }
    ctx.lineTo(X(count - 1), h);
    ctx.lineTo(X(0), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Add glow effect to the line
    ctx.shadowColor = this.stroke;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Stroke the main line
    ctx.beginPath();
    ctx.moveTo(X(0), Y(ds[0]));
    for (let i = 1; i < count; i++) {
      if (i === 1) {
        ctx.lineTo(X(i), Y(ds[i]));
      } else {
        const xc = (X(i - 1) + X(i)) / 2;
        const yc = (Y(ds[i - 1]) + Y(ds[i])) / 2;
        ctx.quadraticCurveTo(X(i - 1), Y(ds[i - 1]), xc, yc);
      }
    }

    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = this.stroke;
    ctx.stroke();

    // Reset shadow for clean texture
    ctx.shadowBlur = 0;

    // Create texture from canvas data URL
    const dataUrl = canvas.toDataURL();

    console.log("🎨 Applying texture, data URL length:", dataUrl.length);

    // Apply texture directly to the component
    this.patch({
      src: dataUrl,
    });

    console.log("✅ Texture applied to component");
  }
}
