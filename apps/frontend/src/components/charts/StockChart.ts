import { Lightning } from "@lightningjs/sdk";
import BaseComponent from "../BaseComponent";
import { Colors } from "../../constants/Colors";
import { ISeriesData, ISeriesPoint } from "../../types/events";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
);

// Plugin to draw black background
const backgroundColorPlugin = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (chart: Chart) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    ctx.save();
    ctx.fillStyle = "#000000"; // Pure black
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

// Register the background plugin
Chart.register(backgroundColorPlugin);

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
 * StockChart Component using Chart.js
 */
export default class StockChart extends BaseComponent {
  private canvas: HTMLCanvasElement | null = null;
  private chart: Chart | null = null;
  private chartData: number[] = [];
  private timestamps: number[] = [];

  private chartWidth = 1600;
  private chartHeight = 520;
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
    this.createChartJsChart();
  }

  showCanvas(): void {
    if (this.canvas) {
      this.canvas.style.display = "block";
    }
  }

  hideCanvas(): void {
    if (this.canvas) {
      this.canvas.style.opacity = "0";
      setTimeout(() => {
        if (this.canvas) {
          this.canvas.style.display = "none";
        }
      }, 300);
    }
  }

  private _readConfiguration(): void {
    const config = this as unknown as ChartConfiguration;
    this.chartWidth = config.chartWidth || this.chartWidth;
    this.chartHeight = config.chartHeight || this.chartHeight;
    this._lineColor = config.lineColor || this._lineColor;
    this.canvasLeft = config.canvasLeft || this.canvasLeft;
    this.canvasTop = config.canvasTop || this.canvasTop;
  }

  private createGradient(
    ctx: CanvasRenderingContext2D,
    chartArea: any,
    lineColor: string,
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    );
    const isPositive = lineColor.includes("00ff88");

    if (isPositive) {
      // Green gradient - fills entire chart area from line to bottom
      gradient.addColorStop(0, "rgba(0, 255, 136, 0.5)");
      gradient.addColorStop(0.25, "rgba(0, 255, 136, 0.35)");
      gradient.addColorStop(0.5, "rgba(0, 255, 136, 0.2)");
      gradient.addColorStop(0.75, "rgba(0, 255, 136, 0.1)");
      gradient.addColorStop(1, "rgba(0, 255, 136, 0.02)");
    } else {
      // Red gradient - fills entire chart area from line to bottom
      gradient.addColorStop(0, "rgba(255, 70, 70, 0.5)");
      gradient.addColorStop(0.25, "rgba(255, 70, 70, 0.35)");
      gradient.addColorStop(0.5, "rgba(255, 70, 70, 0.2)");
      gradient.addColorStop(0.75, "rgba(255, 70, 70, 0.1)");
      gradient.addColorStop(1, "rgba(255, 70, 70, 0.02)");
    }

    return gradient;
  }

  private createChartJsChart(): void {
    const stagePrecision = this.precision;
    const stageDevicePixelRatio =
      (this.stage.getOption("devicePixelRatio") as number) || 1;
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
    this.canvas.style.backgroundColor = "#000000"; // Pure black background

    const baseTransform = `scale(${stagePrecision})`;
    this.canvas.style.transform = baseTransform;
    this.canvas.style.transformOrigin = "0 0";
    this.canvas.style.transition = "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

    const appContainer = document.getElementById("app");
    if (appContainer && appContainer.parentNode) {
      appContainer.parentNode.appendChild(this.canvas);
    }

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // Scale context for high DPI
    ctx.scale(renderDpr, renderDpr);

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Price",
            data: [],
            borderColor: this._lineColor,
            backgroundColor: (context: any) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;

              if (!chartArea) {
                return "transparent";
              }

              return this.createGradient(ctx, chartArea, this._lineColor);
            },
            borderWidth: 2.5,
            fill: "origin",
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this._lineColor,
            pointHoverBorderColor: "#000000",
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
          delay: 100,
          onComplete: () => {},
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        layout: {
          padding: 0,
        },
        backgroundColor: "#000000", // Pure black background
        scales: {
          x: {
            type: "category",
            grid: {
              display: false,
            },
            ticks: {
              color: "#888888",
              font: {
                size: 30,
              },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
            border: {
              display: false,
            },
          },
          y: {
            position: "right",
            grid: {
              color: "rgba(255, 255, 255, 0.08)",
            },
            ticks: {
              color: "#888888",
              font: {
                size: 20,
              },
              callback: function (value: any) {
                return "$" + value.toFixed(2);
              },
            },
            border: {
              display: false,
            },
            grace: "5%", // Add 5% padding top/bottom for better gradient visibility
          },
        },
      },
    });
  }

  set points(data: number[]) {
    if (!data || data.length === 0) return;

    this.chartData = data;
    this.updateChartData();
  }

  set seriesData(data: ISeriesData) {
    if (!data || !data.points || data.points.length === 0) return;

    this.currentPeriod = data.period || "1W";
    this.timestamps = data.points.map((p: ISeriesPoint) => p.t);
    this.chartData = data.points.map((p: ISeriesPoint) => p.c);

    this.updateChartData();
  }

  set lineColor(newColor: string) {
    this._lineColor = newColor;

    if (this.chart && this.chart.data.datasets[0]) {
      this.chart.data.datasets[0].borderColor = newColor;
      (this.chart.data.datasets[0] as any).pointHoverBackgroundColor = newColor;

      // Update backgroundColor function to use new color
      this.chart.data.datasets[0].backgroundColor = (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;

        if (!chartArea) {
          return "transparent";
        }

        return this.createGradient(ctx, chartArea, newColor);
      };

      // Re-animate with new colors
      if (this.chartData.length > 0) {
        this.updateChartData();
      }
    }
  }

  get lineColor(): string {
    return this._lineColor;
  }

  private updateChartData(): void {
    if (!this.chart || !this.chartData.length) return;

    // Generate time labels based on period
    const labels = this.generateTimeLabels();

    // Update chart data
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = this.chartData;

    // Trigger smooth animation
    this.chart.update("active");

    // Fade in canvas
    this.animateFadeIn();
  }

  private generateTimeLabels(): string[] {
    if (!this.timestamps.length) {
      return this.chartData.map((_, i) => i.toString());
    }

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

    return this.timestamps.map((timestamp) => {
      const date = new Date(timestamp);

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
    });
  }

  private animateFadeIn(): void {
    if (!this.canvas) return;

    // Reset opacity
    this.canvas.style.opacity = "0";

    // Smooth fade in with slight delay
    setTimeout(() => {
      if (this.canvas) {
        this.canvas.style.opacity = "1";
      }
    }, 50);
  }

  _detach(): void {
    this.hideCanvas();

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      setTimeout(() => {
        if (this.canvas && this.canvas.parentNode) {
          this.canvas.parentNode.removeChild(this.canvas);
          this.canvas = null;
        }
      }, 300);
    }
  }
}
