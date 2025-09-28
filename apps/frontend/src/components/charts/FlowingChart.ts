import { Lightning } from "@lightningjs/sdk";

export default class FlowingChart extends Lightning.Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private chartData: number[] = [];
  private animationProgress = 0;
  private animationId: number | null = null;

  static _template() {
    return {
      w: 960,
      h: 600,
      rect: true,
      color: 0x00000000, // Transparent
    };
  }

  _init() {
    this.createFlowingCanvas();
  }

  private createFlowingCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900 * dpr;
    this.canvas.height = 500 * dpr;

    // Position like the image - covering the left side only
    this.canvas.style.width = "900px"; // Reduced width to not overlap watchlist
    this.canvas.style.height = "500px";
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "50px";
    this.canvas.style.top = "300px";
    this.canvas.style.zIndex = "1";
    this.canvas.style.pointerEvents = "none"; // Don't interfere with interactions
    this.canvas.style.opacity = "0";
    this.canvas.style.transition = "all 1.5s cubic-bezier(0.4, 0, 0.2, 1)";

    this.ctx = this.canvas.getContext("2d");
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }

    // Add to DOM
    const canvasContainer = document.getElementById("app") as HTMLCanvasElement;
    if (canvasContainer && canvasContainer.parentNode) {
      canvasContainer.parentNode.appendChild(this.canvas);
    }
  }

  set points(data: number[]) {
    if (!data || data.length === 0) return;

    this.chartData = data;
    this.animationProgress = 0;
    this.startFlowingAnimation();
  }

  private startFlowingAnimation() {
    if (!this.canvas) return;

    // Fade in the canvas
    setTimeout(() => {
      if (this.canvas) {
        this.canvas.style.opacity = "1";
      }
    }, 200);

    // Animate the drawing
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);

      // Use easing function for smooth animation
      const easedProgress = this.easeInOutCubic(this.animationProgress);

      this.drawFlowingChart(easedProgress);

      if (this.animationProgress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        // Add subtle breathing animation after main animation
        this.startBreathingEffect();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private drawFlowingChart(progress: number) {
    if (!this.ctx || !this.chartData.length) return;

    const width = 900;
    const height = 500;
    const padding = 80;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Calculate visible points
    const visiblePoints = Math.floor(this.chartData.length * progress);
    if (visiblePoints < 2) return;

    const data = this.chartData.slice(0, visiblePoints);
    const min = Math.min(...this.chartData);
    const max = Math.max(...this.chartData);
    const range = Math.max(max - min, 1);

    // Create flowing gradient for the area
    const areaGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, "rgba(0, 212, 255, 0.3)");
    areaGradient.addColorStop(0.3, "rgba(0, 168, 204, 0.2)");
    areaGradient.addColorStop(0.7, "rgba(0, 212, 255, 0.1)");
    areaGradient.addColorStop(1, "rgba(0, 212, 255, 0)");

    // Generate smooth flowing path using Bezier curves
    const points = this.generateFlowingPoints(
      data,
      width,
      height,
      padding,
      min,
      range
    );

    // Draw flowing area
    this.ctx.beginPath();
    this.drawFlowingPath(points, true);
    this.ctx.lineTo(points[points.length - 1].x, height - padding);
    this.ctx.lineTo(points[0].x, height - padding);
    this.ctx.closePath();
    this.ctx.fillStyle = areaGradient;
    this.ctx.fill();

    // Draw main flowing line with gradient
    const lineGradient = this.ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, "rgba(0, 212, 255, 0.8)");
    lineGradient.addColorStop(0.5, "#00d4ff");
    lineGradient.addColorStop(1, "rgba(0, 168, 204, 0.9)");

    this.ctx.beginPath();
    this.drawFlowingPath(points, false);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = lineGradient;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    // Add glow effect
    this.ctx.shadowColor = "#00d4ff";
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Draw endpoint with pulsing effect
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const pulseSize = 6 + Math.sin(Date.now() * 0.005) * 2;

      this.ctx.beginPath();
      this.ctx.arc(lastPoint.x, lastPoint.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fillStyle = "#00d4ff";
      this.ctx.shadowColor = "#00d4ff";
      this.ctx.shadowBlur = 20;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Outer pulse ring
      this.ctx.beginPath();
      this.ctx.arc(lastPoint.x, lastPoint.y, pulseSize + 8, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(0, 212, 255, 0.3)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private generateFlowingPoints(
    data: number[],
    width: number,
    height: number,
    padding: number,
    min: number,
    range: number
  ) {
    const points: { x: number; y: number }[] = [];

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const baseY =
        padding + (1 - (value - min) / range) * (height - 2 * padding);

      // Add organic flow variation
      const flowVariation =
        Math.sin(index * 0.3) * 10 + Math.cos(index * 0.1) * 5;
      const y = baseY + flowVariation;

      points.push({ x, y });
    });

    return points;
  }

  private drawFlowingPath(points: { x: number; y: number }[], area: boolean) {
    if (points.length < 2) return;

    this.ctx!.moveTo(points[0].x, points[0].y);

    // Use quadratic curves for smooth flowing effect
    for (let i = 1; i < points.length; i++) {
      const currentPoint = points[i];
      const prevPoint = points[i - 1];

      if (i === points.length - 1) {
        // Last point - direct line
        this.ctx!.lineTo(currentPoint.x, currentPoint.y);
      } else {
        // Smooth curve to next point
        const nextPoint = points[i + 1];
        const controlX = currentPoint.x;
        const controlY = currentPoint.y;
        const endX = (currentPoint.x + nextPoint.x) / 2;
        const endY = (currentPoint.y + nextPoint.y) / 2;

        this.ctx!.quadraticCurveTo(controlX, controlY, endX, endY);
      }
    }
  }

  private startBreathingEffect() {
    const breathe = () => {
      if (this.canvas) {
        const breatheValue = 0.95 + Math.sin(Date.now() * 0.002) * 0.05;
        this.canvas.style.transform = `scale(${breatheValue})`;
      }
      requestAnimationFrame(breathe);
    };
    breathe();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _detach() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
