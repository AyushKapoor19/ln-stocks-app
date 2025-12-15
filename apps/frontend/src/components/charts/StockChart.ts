import { Lightning } from "@lightningjs/sdk";
import BaseComponent from "../BaseComponent";
import { Colors } from "../../constants/Colors";
import { ISeriesData, ISeriesPoint } from "../../types/events";

interface ChartConfiguration {
  chartWidth?: number;
  chartHeight?: number;
  padding?: number;
  bottomPadding?: number;
  lineColor?: string;
  canvasLeft?: number;
  canvasTop?: number;
}

/**
 * StockChart Component
 *
 * All dimensions are defined in 1080p coordinates.
 * Canvas is automatically scaled based on device resolution and precision.
 */
export default class StockChart extends BaseComponent {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private chartData: number[] = [];
  private timestamps: number[] = [];
  private animationProgress = 0;

  private chartWidth = 1600;
  private chartHeight = 520;
  private padding = 80;
  private bottomPadding = 120;
  private _lineColor = "#00ff88";
  private canvasLeft = 134;
  private canvasTop = 380;
  private currentPeriod = "1W";

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.transparent,
    };
  }

  _init(): void {
    this._readConfiguration();
    this.createCanvasChart();
  }

  showCanvas(): void {
    if (this.canvas) {
      this.canvas.style.display = "block";
    }
  }

  hideCanvas(): void {
    if (this.canvas) {
      this.canvas.style.display = "none";
    }
  }

  private _readConfiguration(): void {
    const config = this as unknown as ChartConfiguration;
    this.chartWidth = config.chartWidth || this.chartWidth;
    this.chartHeight = config.chartHeight || this.chartHeight;
    this.padding = config.padding || this.padding;
    this.bottomPadding = config.bottomPadding || this.bottomPadding;
    this._lineColor = config.lineColor || this._lineColor;
    this.canvasLeft = config.canvasLeft || this.canvasLeft;
    this.canvasTop = config.canvasTop || this.canvasTop;

    console.log("📊 Chart Configuration:", {
      chartWidth: this.chartWidth,
      chartHeight: this.chartHeight,
      padding: this.padding,
      bottomPadding: this.bottomPadding,
      lineColor: this._lineColor,
      canvasLeft: this.canvasLeft,
      canvasTop: this.canvasTop,
    });
  }

  private createCanvasChart(): void {
    const stagePrecision = this.precision;
    const stageDevicePixelRatio = (this.stage.getOption('devicePixelRatio') as number) || 1;
    const renderDpr = stageDevicePixelRatio * (window.devicePixelRatio || 1);

    this.canvas = document.createElement("canvas");

    const designWidth = this.chartWidth;
    const designHeight = this.chartHeight;

    this.canvas.width = designWidth * renderDpr;
    this.canvas.height = designHeight * renderDpr;

    this.canvas.style.width = `${designWidth}px`;
    this.canvas.style.height = `${designHeight}px`;
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${this.canvasLeft}px`;
    this.canvas.style.top = `${this.canvasTop}px`;
    this.canvas.style.zIndex = "10";
    this.canvas.style.opacity = "0";

    const baseTransform = `scale(${stagePrecision})`;
    this.canvas.style.transform = `${baseTransform} translateY(20px)`;
    this.canvas.style.transformOrigin = "0 0";
    this.canvas.style.transition = "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)";

    this.ctx = this.canvas.getContext("2d");

    if (this.ctx) {
      this.ctx.scale(renderDpr, renderDpr);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
      // @ts-ignore - textRendering is not in CanvasRenderingContext2D types but works in browsers
      this.ctx.textRendering = "optimizeLegibility";
    }

    const canvasContainer = document.getElementById("app") as HTMLCanvasElement;
    if (canvasContainer && canvasContainer.parentNode) {
      canvasContainer.parentNode.appendChild(this.canvas);
    }

    console.log(
      `📊 Canvas created with precision: ${stagePrecision.toFixed(
        3
      )}, renderDpr: ${renderDpr.toFixed(3)}`
    );
    console.log(
      `📐 Design size: ${designWidth}x${designHeight}, Canvas pixels: ${this.canvas.width}x${this.canvas.height}`
    );
  }

  set points(data: number[]) {
    console.log("📊 StockChart received points:", data);

    if (!data || data.length === 0) return;

    this.chartData = data;
    this.animationProgress = 0;
    this.animateChart();
  }

  set seriesData(data: ISeriesData) {
    if (!data || !data.points || data.points.length === 0) return;

    this.currentPeriod = data.period || "1W";
    this.timestamps = data.points.map((p: ISeriesPoint) => p.t);
    this.chartData = data.points.map((p: ISeriesPoint) => p.c);
    this.animationProgress = 0;

    console.log(
      `📊 Chart loaded ${this.chartData.length} points for period ${this.currentPeriod}`
    );

    this.animateChart();
  }

  set lineColor(newColor: string) {
    this._lineColor = newColor;
    if (this.chartData && this.chartData.length > 0) {
      this.drawChart();
    }
  }

  get lineColor(): string {
    return this._lineColor;
  }

  private animateChart(): void {
    if (!this.canvas) return;

    const stagePrecision = this.precision;
    const baseTransform = `scale(${stagePrecision})`;

    setTimeout(() => {
      if (this.canvas) {
        this.canvas.style.opacity = "1";
        this.canvas.style.transform = `${baseTransform} translateY(0)`;
      }
    }, 100);

    this.animateDrawing();
  }

  private animateDrawing(): void {
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

  private drawChart(): void {
    if (!this.ctx || !this.chartData.length) return;

    const width = this.chartWidth;
    const height = this.chartHeight;
    const padding = this.padding;
    const bottomPadding = this.bottomPadding;

    // Clear canvas with black background
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, width, height);

    const min = Math.min.apply(null, this.chartData);
    const max = Math.max.apply(null, this.chartData);
    const range = Math.max(max - min, 1);

    this.drawGridLines(width, height, padding, bottomPadding, min, max);

    const visiblePoints = Math.floor(
      this.chartData.length * this.animationProgress
    );
    if (visiblePoints < 2) return;

    const data = this.chartData.slice(0, visiblePoints);

    const gradient = this.ctx.createLinearGradient(
      0,
      padding,
      0,
      height - bottomPadding
    );

    const isPositive = this._lineColor.includes("00ff88");

    if (isPositive) {
      gradient.addColorStop(0, `rgba(0, 100, 80, 0.3)`);
      gradient.addColorStop(0.5, `rgba(0, 60, 50, 0.15)`);
      gradient.addColorStop(1, `rgba(0, 30, 25, 0.0)`);
    } else {
      gradient.addColorStop(0, `rgba(100, 30, 30, 0.3)`);
      gradient.addColorStop(0.5, `rgba(60, 20, 20, 0.15)`);
      gradient.addColorStop(1, `rgba(30, 10, 10, 0.0)`);
    }

    this.ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y =
        padding +
        (1 - (point - min) / range) * (height - padding - bottomPadding);

      if (index === 0) {
        if (this.ctx) {
          this.ctx.moveTo(x, y);
        }
      } else {
        if (this.ctx) {
          this.ctx.lineTo(x, y);
        }
      }
    });

    const lastX =
      padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
    const bottomY = height - bottomPadding;
    this.ctx.lineTo(lastX, bottomY);
    this.ctx.lineTo(padding, bottomY);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.beginPath();

    if (data.length > 2) {
      const points = data.map((point, index) => ({
        x: padding + (index / (data.length - 1)) * (width - 2 * padding),
        y:
          padding +
          (1 - (point - min) / range) * (height - padding - bottomPadding),
      }));

      this.ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];

        const controlPointX = (currentPoint.x + nextPoint.x) / 2;
        const controlPointY = (currentPoint.y + nextPoint.y) / 2;

        this.ctx.quadraticCurveTo(
          currentPoint.x,
          currentPoint.y,
          controlPointX,
          controlPointY
        );
      }

      const lastPoint = points[points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    } else {
      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y =
          padding +
          (1 - (point - min) / range) * (height - padding - bottomPadding);

        if (index === 0) {
          if (this.ctx) {
            this.ctx.moveTo(x, y);
          }
        } else {
          if (this.ctx) {
            this.ctx.lineTo(x, y);
          }
        }
      });
    }

    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = this._lineColor;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.shadowColor = this._lineColor;
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    this.drawMonthLabels(width, height, padding, bottomPadding);
    this.drawPriceLabels(width, height, padding, bottomPadding, min, max);
  }

  private drawGridLines(
    width: number,
    height: number,
    padding: number,
    bottomPadding: number,
    min: number,
    max: number
  ): void {
    if (!this.ctx) return;

    const labelCount = 5;

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    for (let i = 0; i < labelCount; i++) {
      const y =
        padding +
        (1 - i / (labelCount - 1)) * (height - padding - bottomPadding);

      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(width - padding, y);
      this.ctx.stroke();
    }
  }

  private drawMonthLabels(
    width: number,
    height: number,
    padding: number,
    bottomPadding: number
  ): void {
    if (!this.ctx || !this.chartData || this.chartData.length === 0) return;

    this.ctx.fillStyle = "#888888";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";

    const labelCount = 8;

    for (let i = 0; i < labelCount; i++) {
      const x = padding + (i / (labelCount - 1)) * (width - 2 * padding);
      const y = height - bottomPadding + 40;

      const dataIndex = Math.floor(
        (i / (labelCount - 1)) * (this.chartData.length - 1)
      );

      const labelText = this.generateTimeLabel(
        dataIndex,
        this.chartData.length
      );

      if (this.ctx && labelText) {
        this.ctx.fillText(labelText, x, y);
      }
    }
  }

  private generateTimeLabel(
    dataIndex: number,
    totalDataPoints: number
  ): string {
    if (this.timestamps && this.timestamps[dataIndex]) {
      const timestamp = this.timestamps[dataIndex];
      const date = new Date(timestamp);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      switch (this.currentPeriod) {
        case "1D":
          const hours = date.getHours();
          const minutes = date.getMinutes();
          return `${hours}:${minutes.toString().padStart(2, "0")}`;

        case "1W":
        case "1M":
          return `${monthNames[date.getMonth()]} ${date
            .getDate()
            .toString()
            .padStart(2, "0")}`;

        case "3M":
        case "1Y":
          return monthNames[date.getMonth()];

        default:
          return date.toLocaleDateString();
      }
    }

    return "";
  }

  private drawPriceLabels(
    width: number,
    height: number,
    padding: number,
    bottomPadding: number,
    min: number,
    max: number
  ): void {
    if (!this.ctx) return;

    const range = max - min;
    const labelCount = 5;
    const step = range / (labelCount - 1);

    this.ctx.fillStyle = "#888888";
    this.ctx.font = "14px Arial";
    this.ctx.textAlign = "right";

    for (let i = 0; i < labelCount; i++) {
      const price = min + i * step;
      const y =
        padding +
        (1 - i / (labelCount - 1)) * (height - padding - bottomPadding);

      const formattedPrice = price.toFixed(2);

      if (this.ctx) {
        this.ctx.fillText(formattedPrice, width - 20, y + 5);
      }
    }
  }

  _detach(): void {
    this.hideCanvas();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
    }
  }
}
