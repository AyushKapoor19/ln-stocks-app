import { Lightning } from "@lightningjs/sdk";
import { createChart } from "lightweight-charts";

export default class TradingViewChart extends Lightning.Component {
  private chart: any = null;
  private lineSeries: any = null;
  private chartContainer: HTMLDivElement | null = null;
  private chartData: number[] = [];
  private _lineColor = "#00d27a";

  static _template() {
    return {
      w: 1000,
      h: 200,
      rect: true,
      color: 0x00000000, // Transparent - chart will handle the visuals
    };
  }

  _init() {
    this.createChartContainer();
    this.setupChart();
  }

  private createChartContainer() {
    // Create a DOM container for the TradingView chart
    this.chartContainer = document.createElement("div");
    this.chartContainer.style.position = "absolute";
    this.chartContainer.style.left = "80px";
    this.chartContainer.style.top = "280px";
    this.chartContainer.style.width = "1000px";
    this.chartContainer.style.height = "200px";
    this.chartContainer.style.zIndex = "10";

    // Find the canvas and append our chart container
    const canvas = document.getElementById("app") as HTMLCanvasElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.appendChild(this.chartContainer);
    }
  }

  private setupChart() {
    if (!this.chartContainer) return;

    console.log("🚀 Setting up TradingView chart...");
    console.log("📦 createChart function:", typeof createChart);

    try {
      this.chart = createChart(this.chartContainer, {
        width: 1000,
        height: 200,
        layout: {
          background: { color: "transparent" },
          textColor: "#ffffff",
          fontSize: 12,
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.1)" },
          horzLines: { color: "rgba(255, 255, 255, 0.1)" },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: "rgba(255, 255, 255, 0.3)",
          textColor: "#ffffff",
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          borderColor: "rgba(255, 255, 255, 0.3)",
          timeVisible: false,
          secondsVisible: false,
        },
        handleScroll: false,
        handleScale: false,
      });

      console.log("✅ Chart created:", this.chart);
      console.log("📊 Chart methods:", Object.keys(this.chart));

      this.lineSeries = this.chart.addLineSeries({
        color: this._lineColor,
        lineWidth: 3,
        crosshairMarkerVisible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      console.log("📈 Line series created:", this.lineSeries);
    } catch (error) {
      console.error("❌ Error creating TradingView chart:", error);
    }
  }

  set points(data: number[]) {
    console.log("📊 TradingView chart received points:", data);
    console.log("🔗 Line series exists:", !!this.lineSeries);

    if (!this.lineSeries || !data || data.length === 0) {
      console.warn("❌ Cannot set points - missing line series or data");
      return;
    }

    this.chartData = data;

    // Convert data to TradingView format
    const chartData = data.map((price, index) => ({
      time: Math.floor(
        (Date.now() - (data.length - index) * 24 * 60 * 60 * 1000) / 1000
      ), // Unix timestamp in seconds
      value: price,
    }));

    console.log("📈 Converted chart data:", chartData.slice(0, 3), "...");

    // Set data and animate
    this.lineSeries.setData(chartData);

    // Animate the chart appearance
    this.animateChart();
  }

  set lineColor(newColor: string) {
    this._lineColor = newColor;
    if (this.lineSeries) {
      this.lineSeries.applyOptions({
        color: newColor,
      });
    }
  }

  private animateChart() {
    if (!this.chartContainer) return;

    // Start with chart hidden
    this.chartContainer.style.opacity = "0";
    this.chartContainer.style.transform = "translateY(20px)";
    this.chartContainer.style.transition =
      "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)";

    // Animate in
    setTimeout(() => {
      if (this.chartContainer) {
        this.chartContainer.style.opacity = "1";
        this.chartContainer.style.transform = "translateY(0)";
      }
    }, 100);

    // Fit chart content with animation
    setTimeout(() => {
      if (this.chart) {
        this.chart.timeScale().fitContent();
      }
    }, 600);
  }

  _detach() {
    // Clean up the chart when component is destroyed
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
    if (this.chartContainer && this.chartContainer.parentNode) {
      this.chartContainer.parentNode.removeChild(this.chartContainer);
      this.chartContainer = null;
    }
  }

  // Handle Lightning JS focus states
  _focus() {
    if (this.chartContainer) {
      this.chartContainer.style.opacity = "1";
    }
  }

  _unfocus() {
    if (this.chartContainer) {
      this.chartContainer.style.opacity = "0.8";
    }
  }
}
