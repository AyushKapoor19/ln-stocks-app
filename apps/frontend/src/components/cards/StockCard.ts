import { Lightning } from "@lightningjs/sdk";
import { theme } from "../../app/theme.js";
import { Stock } from "../../types/finance.js";
import Sparkline from "../charts/Sparkline.js";

export interface StockCardTemplateSpec
  extends Lightning.Component.TemplateSpec {
  Background: object;
  Logo: object;
  Content: {
    CompanyName: object;
    Symbol: object;
    Price: object;
    Change: object;
  };
  Chart: object;
  FocusIndicator: object;
}

interface StockCardTypeConfig extends Lightning.Component.TypeConfig {
  stock: Stock;
  width?: number;
  height?: number;
  focused?: boolean;
}

export default class StockCard extends Lightning.Component<
  StockCardTemplateSpec,
  StockCardTypeConfig
> {
  static _template(): Lightning.Component.Template<StockCardTemplateSpec> {
    return {
      w: 400,
      h: 120,

      Background: {
        w: (w: number) => w,
        h: (h: number) => h,
        rect: true,
        color: theme.colors.surface,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: theme.borderRadius.md,
        },
      },

      FocusIndicator: {
        w: (w: number) => w,
        h: (h: number) => h,
        rect: true,
        color: 0x00ffffff,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: theme.borderRadius.md,
          stroke: 2,
          strokeColor: theme.colors.focusOutline,
        },
        alpha: 0,
      },

      Logo: {
        x: theme.spacing.md,
        y: theme.spacing.md,
        w: 48,
        h: 48,
        rect: true,
        color: theme.colors.surfaceLight,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },
      },

      Content: {
        x: theme.spacing.md + 48 + theme.spacing.sm,
        y: theme.spacing.md,

        CompanyName: {
          text: {
            text: "",
            fontFace: theme.fonts.primary,
            fontSize: 22,
            textColor: theme.colors.textPrimary,
            wordWrapWidth: 200,
          },
        },

        Symbol: {
          y: 28,
          text: {
            text: "",
            fontFace: theme.fonts.mono,
            fontSize: 16,
            textColor: theme.colors.textSecondary,
          },
        },

        Price: {
          y: 52,
          text: {
            text: "",
            fontFace: theme.fonts.primary,
            fontSize: 24,
            textColor: theme.colors.textPrimary,
            fontStyle: "bold",
          },
        },

        Change: {
          x: 140,
          y: 56,
          text: {
            text: "",
            fontFace: theme.fonts.mono,
            fontSize: 16,
            textColor: theme.colors.success,
          },
        },
      },

      Chart: {
        x: (w: number) => w - 200 - theme.spacing.md,
        y: theme.spacing.md + 20,
        type: Sparkline,
        width: 160,
        height: 50,
        strokeWidth: 2,
      },
    };
  }

  _init() {
    this._setupCard();
  }

  set stock(value: Stock) {
    this._stock = value;
    this._setupCard();
  }

  get stock(): Stock | undefined {
    return this._stock;
  }

  set focused(value: boolean) {
    this._focused = value;
    this._updateFocus();
  }

  get focused(): boolean {
    return this._focused || false;
  }

  private _stock?: Stock;
  private _focused: boolean = false;

  private _setupCard() {
    if (!this._stock) return;

    // Set company name and symbol
    this.tag("Content.CompanyName")!.text!.text = this._truncateText(
      this._stock.companyName,
      20
    );
    this.tag("Content.Symbol")!.text!.text = this._stock.symbol;

    // Format and set price
    const formattedPrice = this._formatPrice(this._stock.price);
    this.tag("Content.Price")!.text!.text = formattedPrice;

    // Format and set change
    const changeText = this._formatChange(
      this._stock.change,
      this._stock.changePercent
    );
    const changeColor =
      this._stock.change >= 0 ? theme.colors.success : theme.colors.danger;

    this.tag("Content.Change")!.text!.text = changeText;
    this.tag("Content.Change")!.text!.textColor = changeColor;

    // Set up logo if available
    if (this._stock.logo) {
      this.tag("Logo")!.texture = Lightning.Tools.getImgTexture(
        this._stock.logo
      );
    } else {
      // Create a simple text logo from company initial
      const initial = this._stock.companyName.charAt(0).toUpperCase();
      this._createTextLogo(initial);
    }

    // Set up chart data
    if (this._stock.sparkline && this._stock.sparkline.length > 1) {
      const chartComponent = this.tag("Chart") as Sparkline;
      chartComponent.data = this._stock.sparkline;
      chartComponent.color =
        this._stock.change >= 0 ? theme.colors.success : theme.colors.danger;
    }

    // Animate in
    this._animateIn();
  }

  private _createTextLogo(text: string) {
    const logoTag = this.tag("Logo")!;
    logoTag.texture = Lightning.Tools.getCanvasTexture(
      (canvas) => {
        const ctx = canvas.getContext("2d")!;
        canvas.width = 48;
        canvas.height = 48;

        // Background
        ctx.fillStyle = "#2A2A2A";
        ctx.fillRect(0, 0, 48, 48);

        // Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 20px SF Pro Display, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 24, 24);
      },
      48,
      48
    );
  }

  private _formatPrice(price: number): string {
    if (price >= 1000) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  private _formatChange(change: number, changePercent: number): string {
    const sign = change >= 0 ? "+" : "";
    const formattedPercent = Math.abs(changePercent).toFixed(2);
    return `${sign}${formattedPercent}%`;
  }

  private _truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  private _updateFocus() {
    const focusIndicator = this.tag("FocusIndicator")!;
    const background = this.tag("Background")!;

    if (this._focused) {
      // Show focus indicator
      focusIndicator.setSmooth("alpha", 1, {
        duration: theme.animations.duration.fast,
      });

      // Slightly brighten background
      background.setSmooth("color", theme.colors.surfaceLight, {
        duration: theme.animations.duration.fast,
      });

      // Scale up slightly
      this.setSmooth("scale", 1.02, {
        duration: theme.animations.duration.fast,
      });
    } else {
      // Hide focus indicator
      focusIndicator.setSmooth("alpha", 0, {
        duration: theme.animations.duration.fast,
      });

      // Return to normal background
      background.setSmooth("color", theme.colors.surface, {
        duration: theme.animations.duration.fast,
      });

      // Return to normal scale
      this.setSmooth("scale", 1, {
        duration: theme.animations.duration.fast,
      });
    }
  }

  private _animateIn() {
    // Start with slightly transparent and scaled down
    this.alpha = 0.8;
    this.scale = 0.95;

    // Animate to full visibility and size
    this.setSmooth("alpha", 1, {
      duration: theme.animations.duration.normal,
      delay: Math.random() * 200, // Stagger animation
    });

    this.setSmooth("scale", 1, {
      duration: theme.animations.duration.normal,
      delay: Math.random() * 200,
    });
  }

  // Handle remote control navigation
  _handleEnter() {
    // Navigate to stock detail when selected
    if (this._stock) {
      this.signal("selectStock", this._stock);
    }
  }

  _getFocused() {
    return this;
  }

  _focus() {
    this.focused = true;
  }

  _unfocus() {
    this.focused = false;
  }
}
