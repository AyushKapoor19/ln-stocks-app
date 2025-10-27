import { Lightning } from "@lightningjs/sdk";

interface ChartConfiguration {
  chartWidth?: number;
  chartHeight?: number;
  padding?: number;
  bottomPadding?: number;
  lineColor?: string;
  canvasLeft?: number;
  canvasTop?: number;
}

export default class BeautifulChart extends Lightning.Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private chartData: number[] = [];
  private timestamps: number[] = []; // Store timestamps for dynamic labels
  private animationProgress = 0;

  // Configurable properties (with defaults)
  private chartWidth = 1600;
  private chartHeight = 550;
  private padding = 80;
  private bottomPadding = 120;
  private _lineColor = "#00ff88";
  private canvasLeft = 134;
  private canvasTop = 340;
  private currentPeriod = "1W"; // Track current time period

  static _template(): object {
    return {
      w: (w: number) => w, // Use parent width
      h: (h: number) => h, // Use parent height
      rect: true,
      color: 0x00000000, // Transparent
    };
  }

  _init(): void {
    // Read configuration from parent props
    this._readConfiguration();
    this.createCanvasChart();
  }

  private _readConfiguration(): void {
    // Read props passed from parent component (Lightning.js props)
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
    // Create high-DPI canvas element
    const dpr = window.devicePixelRatio || 1;
    this.canvas = document.createElement("canvas");

    // Set actual canvas size for high DPI using configured dimensions
    this.canvas.width = this.chartWidth * dpr;
    this.canvas.height = this.chartHeight * dpr;

    // Set CSS size to maintain visual size using configured dimensions
    this.canvas.style.width = `${this.chartWidth}px`;
    this.canvas.style.height = `${this.chartHeight}px`;
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${this.canvasLeft}px`; // Use configured position
    this.canvas.style.top = `${this.canvasTop}px`; // Use configured position
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
      (this.ctx as any).textRendering = "optimizeLegibility";
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

  // New setter to receive full series data with timestamps
  set seriesData(data: any) {
    if (!data || !data.points || data.points.length === 0) return;

    this.currentPeriod = data.period || "1W";
    this.timestamps = data.points.map((p: any) => p.t);
    this.chartData = data.points.map((p: any) => p.c);
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

    // Use configured dimensions instead of hardcoded values
    const width = this.chartWidth;
    const height = this.chartHeight;
    const padding = this.padding;
    const bottomPadding = this.bottomPadding;

    // Clear canvas with black background
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, width, height);

    // Calculate data bounds
    const min = Math.min(...this.chartData);
    const max = Math.max(...this.chartData);
    const range = Math.max(max - min, 1);

    // Calculate visible points based on animation progress
    const visiblePoints = Math.floor(
      this.chartData.length * this.animationProgress
    );
    if (visiblePoints < 2) return;

    const data = this.chartData.slice(0, visiblePoints);

    // Create gradient for area fill (matching the green from the image)
    const gradient = this.ctx.createLinearGradient(
      0,
      padding,
      0,
      height - bottomPadding
    );
    const [r, g, b] = this.hexToRgb(this._lineColor);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.1)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

    // Draw area fill first
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

    // Complete the area to bottom
    const lastX =
      padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
    const bottomY = height - bottomPadding;
    this.ctx.lineTo(lastX, bottomY);
    this.ctx.lineTo(padding, bottomY);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw smooth curved line using quadratic curves
    this.ctx.beginPath();

    if (data.length > 2) {
      // Calculate points for smooth curve
      const points = data.map((point, index) => ({
        x: padding + (index / (data.length - 1)) * (width - 2 * padding),
        y:
          padding +
          (1 - (point - min) / range) * (height - padding - bottomPadding),
      }));

      // Start the path
      this.ctx.moveTo(points[0].x, points[0].y);

      // Draw smooth curves between points
      for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];

        // Calculate control point for smooth curve
        const controlPointX = (currentPoint.x + nextPoint.x) / 2;
        const controlPointY = (currentPoint.y + nextPoint.y) / 2;

        this.ctx.quadraticCurveTo(
          currentPoint.x,
          currentPoint.y,
          controlPointX,
          controlPointY
        );
      }

      // Draw to the last point
      const lastPoint = points[points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    } else {
      // Fallback for small datasets
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

    // Add subtle glow effect
    this.ctx.shadowColor = this._lineColor;
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.stroke();

    // Reset shadow for other drawings
    this.ctx.shadowBlur = 0;

    // Draw month labels on X-axis and Y-axis price labels
    this.drawMonthLabels(width, height, padding, bottomPadding);
    this.drawPriceLabels(width, height, padding, bottomPadding, min, max);
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

    // Calculate how many labels to show based on chart width and data points
    const maxLabels = 8;
    const dataPointsPerLabel = Math.floor(this.chartData.length / maxLabels);

    // Generate dynamic labels based on data distribution
    const labels = [];
    for (let i = 0; i < maxLabels; i++) {
      const dataIndex = Math.min(
        i * dataPointsPerLabel,
        this.chartData.length - 1
      );
      labels.push(dataIndex);
    }

    // Add last point if not already included
    if (labels[labels.length - 1] !== this.chartData.length - 1) {
      labels.push(this.chartData.length - 1);
    }

    // Draw labels at calculated positions
    labels.forEach((dataIndex, labelIndex) => {
      const x =
        padding +
        (dataIndex / (this.chartData.length - 1)) * (width - 2 * padding);
      const y = height - bottomPadding + 40;

      // Format label based on data position
      // For now, use simple position-based labels
      // In future, we can use actual timestamps from series data
      const labelText = this.generateTimeLabel(labelIndex, labels.length);

      if (this.ctx) {
        this.ctx.fillText(labelText, x, y);
      }
    });
  }

  private generateTimeLabel(index: number, total: number): string {
    // Use actual timestamps if available
    const actualIndex = Math.floor(
      (index / (total - 1)) * (this.timestamps.length - 1)
    );

    if (this.timestamps && this.timestamps[actualIndex]) {
      const timestamp = this.timestamps[actualIndex];
      const date = new Date(timestamp);

      // Format based on time period
      switch (this.currentPeriod) {
        case "1D":
          // Show times (e.g., "12:00", "15:00")
          const hours = date.getHours();
          const minutes = date.getMinutes();
          return `${hours}:${minutes.toString().padStart(2, "0")}`;

        case "1W":
          // Show day/month (e.g., "Oct 06")
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
          return `${monthNames[date.getMonth()]} ${date
            .getDate()
            .toString()
            .padStart(2, "0")}`;

        case "1M":
          // Show dates (e.g., "Sep 08", "Sep 12")
          const monthNamesMonth = [
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
          return `${monthNamesMonth[date.getMonth()]} ${date
            .getDate()
            .toString()
            .padStart(2, "0")}`;

        case "3M":
        case "1Y":
          // Show months only (e.g., "Oct", "Nov", "Dec")
          const monthNamesYear = [
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
          return monthNamesYear[date.getMonth()];

        default:
          return date.toLocaleDateString();
      }
    }

    // Fallback if no timestamps (shouldn't happen)
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

    // Calculate nice price intervals for Y-axis
    const range = max - min;
    const labelCount = 5; // Show 5 price levels
    const step = range / (labelCount - 1);

    this.ctx.fillStyle = "#888888";
    this.ctx.font = "14px Arial";
    this.ctx.textAlign = "right";

    // Draw price labels on the right side of the chart
    for (let i = 0; i < labelCount; i++) {
      const price = min + i * step;
      const y =
        padding +
        (1 - i / (labelCount - 1)) * (height - padding - bottomPadding);

      // Format price to 2 decimal places
      const formattedPrice = price.toFixed(2);

      if (this.ctx) {
        this.ctx.fillText(formattedPrice, width - 20, y + 5); // Position on right side
      }
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

  _detach(): void {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
  }
}
