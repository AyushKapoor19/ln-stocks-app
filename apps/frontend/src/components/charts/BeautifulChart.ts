import { Lightning } from "@lightningjs/sdk";

export default class BeautifulChart extends Lightning.Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private chartData: number[] = [];
  private _lineColor = "#f23645"; // Default TradingView red
  private animationProgress = 0;

  static _template() {
    return {
      w: 1000,
      h: 200,
      rect: true,
      color: 0x00000000, // Transparent
    };
  }

  _init() {
    this.createCanvasChart();
  }

  private createCanvasChart() {
    // Create high-DPI canvas element
    const dpr = window.devicePixelRatio || 1;
    this.canvas = document.createElement("canvas");

    // Set actual canvas size for high DPI (larger for TradingView style)
    this.canvas.width = 1200 * dpr;
    this.canvas.height = 250 * dpr;

    // Set CSS size to maintain visual size (larger like TradingView)
    this.canvas.style.width = "1200px";
    this.canvas.style.height = "250px";
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "80px";
    this.canvas.style.top = "290px";
    this.canvas.style.zIndex = "10";
    this.canvas.style.opacity = "0";
    this.canvas.style.transform = "translateY(20px)";
    this.canvas.style.transition = "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)";

    this.ctx = this.canvas.getContext("2d");

    if (this.ctx) {
      // Scale context for high DPI
      this.ctx.scale(dpr, dpr);

      // Enable better rendering
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";

      // Better text rendering
      this.ctx.textRendering = "optimizeLegibility" as any;
    }

    // Add to DOM
    const canvasContainer = document.getElementById("app") as HTMLCanvasElement;
    if (canvasContainer && canvasContainer.parentNode) {
      canvasContainer.parentNode.appendChild(this.canvas);
    }
  }

  set points(data: number[]) {
    console.log("📊 BeautifulChart received points:", data);

    if (!data || data.length === 0) return;

    this.chartData = data;
    this.animationProgress = 0;

    // Start animation
    this.animateChart();
  }

  set lineColor(newColor: string) {
    this._lineColor = newColor;
    if (this.chartData && this.chartData.length > 0) {
      this.drawChart();
    }
  }

  private animateChart() {
    if (!this.canvas) return;

    // Slide in animation
    setTimeout(() => {
      if (this.canvas) {
        this.canvas.style.opacity = "1";
        this.canvas.style.transform = "translateY(0)";
      }
    }, 100);

    // Animate drawing
    this.animateDrawing();
  }

  private animateDrawing() {
    const animate = () => {
      this.animationProgress += 0.03;
      if (this.animationProgress > 1) {
        this.animationProgress = 1;
      }

      this.drawChart();

      if (this.animationProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private drawChart() {
    if (!this.ctx || !this.chartData.length) return;

    const width = 1200;
    const height = 250;
    const padding = 50;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw dark background like TradingView
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, width, height);

    // Calculate data bounds
    const min = Math.min(...this.chartData);
    const max = Math.max(...this.chartData);
    const range = Math.max(max - min, 1);

    // Draw grid lines like TradingView
    this.drawGrid(width, height, padding, min, max, range);

    // Calculate visible points based on animation progress
    const visiblePoints = Math.floor(
      this.chartData.length * this.animationProgress
    );
    if (visiblePoints < 2) return;

    const data = this.chartData.slice(0, visiblePoints);

    // Create subtle gradient area fill
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    const [r, g, b] = this.hexToRgb(this._lineColor);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.02)`);

    // Draw area fill
    this.ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (point - min) / range) * (height - 2 * padding);

      if (index === 0) {
        this.ctx?.moveTo(x, y);
      } else {
        this.ctx?.lineTo(x, y); // Straight lines like TradingView
      }
    });

    // Complete the area
    const lastX =
      padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
    this.ctx.lineTo(lastX, height - padding);
    this.ctx.lineTo(padding, height - padding);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw main line (no glow, clean like TradingView)
    this.ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (point - min) / range) * (height - 2 * padding);

      if (index === 0) {
        this.ctx?.moveTo(x, y);
      } else {
        this.ctx?.lineTo(x, y); // Straight lines like TradingView
      }
    });

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this._lineColor;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.stroke();

    // Draw price labels on the right (like TradingView)
    this.drawPriceAxis(width, height, padding, min, max, range);
  }

  private drawGrid(
    width: number,
    height: number,
    padding: number,
    min: number,
    max: number,
    range: number
  ) {
    if (!this.ctx) return;

    // Horizontal grid lines
    const gridLines = 5;
    if (this.ctx) {
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      this.ctx.lineWidth = 1;
    }

    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (i / gridLines) * (height - 2 * padding);
      if (this.ctx) {
        this.ctx.beginPath();
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(width - padding, y);
        this.ctx.stroke();
      }
    }

    // Vertical grid lines (lighter)
    const verticalLines = 6;
    if (this.ctx) {
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    }
    for (let i = 0; i <= verticalLines; i++) {
      const x = padding + (i / verticalLines) * (width - 2 * padding);
      if (this.ctx) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, padding);
        this.ctx.lineTo(x, height - padding);
        this.ctx.stroke();
      }
    }
  }

  private drawPriceAxis(
    width: number,
    height: number,
    padding: number,
    min: number,
    max: number,
    range: number
  ) {
    if (!this.ctx) return;

    this.ctx.fillStyle = "#888888";
    this.ctx.font = "12px Arial";
    this.ctx.textAlign = "left";

    // Draw price levels on the right
    const priceLines = 5;
    for (let i = 0; i <= priceLines; i++) {
      const priceValue = max - (i / priceLines) * range;
      const y = padding + (i / priceLines) * (height - 2 * padding);

      // Price text
      this.ctx.fillText(priceValue.toFixed(2), width - 35, y + 4);

      // Horizontal reference line
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([2, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(width - 40, y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [255, 255, 255];
  }

  _detach() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
  }
}
