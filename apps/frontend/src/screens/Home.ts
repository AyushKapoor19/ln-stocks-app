import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import StockChart from "../components/charts/StockChart";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import { stocksApi } from "../services/api";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import {
  ISearchResult,
  ISearchActivatedEvent,
  ISearchDeactivatedEvent,
  IShowSearchResultsEvent,
  IUpdateSearchSelectionEvent,
  INavigateSearchResultsEvent,
  ISelectStockEvent,
  ISeriesData,
} from "../types/events";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

interface TimePeriod {
  id: string;
  label: string;
  days: number;
}

interface LightningComponent {
  tag(tagName: string): LightningComponent | null;
  text: {
    textColor: number;
  };
  color: number;
  setSmooth(
    property: string,
    value: number,
    options: { duration: number }
  ): void;
}

const TIME_PERIODS: TimePeriod[] = [
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "1Y", label: "1Y", days: 365 },
];

/**
 * Home Screen
 *
 * All coordinates are designed for 1080p (1920x1080).
 * Lightning.js automatically scales based on actual device resolution.
 */
export default class Home extends BaseScreen {
  private currentTimePeriod: TimePeriod = { id: "1M", label: "1M", days: 30 };
  private selectedPeriodIndex = 0;
  private isLoading = false;
  private currentPrice = 428.75;
  private currentChange = 2.45;
  private currentChangePct = 0.0057;
  private currentSymbol = "VOO";
  private currentStockName = "Vanguard S&P 500 ETF";
  private searchQuery = "";
  private searchResults: ISearchResult[] = [];
  private selectedSearchIndex = 0;
  private isSearchActive = false;
  private searchTimeout: NodeJS.Timeout | undefined = undefined;
  private currentFocusIndex = 1;
  private focusableElements: string[] = [
    "SearchBar",
    "SignInButton",
    "TimeButton_1M",
    "TimeButton_3M",
    "TimeButton_1Y",
    "WatchlistStarButton",
  ];
  private marketIndices: MarketIndex[] = [
    {
      symbol: "SPX",
      name: "S&P 500",
      price: 5876.0,
      change: 49.5,
      changePct: 0.0085,
    },
    {
      symbol: "DJI",
      name: "Dow Jones",
      price: 42840.0,
      change: 221.5,
      changePct: 0.0052,
    },
    {
      symbol: "IXIC",
      name: "Nasdaq",
      price: 19340.0,
      change: 237.2,
      changePct: 0.0124,
    },
  ];

  static _template(): object {
    const FRAME_LEFT = 60;
    const FRAME_TOP = 50;
    const FRAME_RIGHT = 60;
    const CONTENT_WIDTH = 1920 - FRAME_LEFT - FRAME_RIGHT; // 1800px

    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

      // Top Bar
      SearchBar: {
        type: SearchBar,
        x: FRAME_LEFT + CONTENT_WIDTH - 470,
        y: FRAME_TOP,
      },

      SignInButton: {
        x: FRAME_LEFT + CONTENT_WIDTH - 70,
        y: FRAME_TOP,
        w: 70,
        h: 56,
        rect: true,
        color: Colors.transparent,
        Background: {
          w: 70,
          h: 56,
          rect: true,
          color: Colors.buttonUnfocused,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 28 },
        },
        Icon: {
          x: 35,
          y: 28,
          mount: 0.5,
          text: {
            text: "👤",
            fontSize: FontSize.Medium,
            textColor: Colors.textPrimary,
          },
        },
      },

      SearchResults: {
        type: SearchResults,
        x: FRAME_LEFT + CONTENT_WIDTH - 470,
        y: FRAME_TOP + 66,
        alpha: 0,
      },

      // Market Status Indicator
      MarketStatus: {
        x: FRAME_LEFT,
        y: FRAME_TOP,
        StatusDot: {
          w: 10,
          h: 10,
          rect: true,
          color: Colors.stockGreenBright,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 5 },
        },
        StatusText: {
          x: 20,
          y: -2,
          text: {
            text: "Market Open",
            fontFace: FontFamily.Default,
            fontSize: 20,
            fontStyle: FontStyle.SemiBold,
            textColor: Colors.textPrimary,
          },
        },
        Separator: {
          x: 140,
          y: -8,
          w: 3,
          h: 35,
          rect: true,
          color: 0x55ffffff,
        },
        TimeText: {
          x: 156,
          y: -2,
          text: {
            text: "9:30 AM - 4:00 PM EST",
            fontFace: FontFamily.Default,
            fontSize: 20,
            fontStyle: FontStyle.Regular,
            textColor: Colors.textTertiary,
          },
        },
      },

      // Main Stock Display
      MainDisplay: {
        x: FRAME_LEFT,
        y: FRAME_TOP + 70,
        StockSymbol: {
          text: {
            text: "VOO",
            fontFace: FontFamily.Default,
            fontSize: 42,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
          },
        },
        StockName: {
          x: 120,
          y: 14,
          text: {
            text: "Vanguard S&P 500 ETF",
            fontFace: FontFamily.Default,
            fontSize: FontSize.Large,
            fontStyle: FontStyle.Regular,
            textColor: Colors.textTertiary,
          },
        },
        StockPrice: {
          y: 60,
          text: {
            text: "$428.75",
            fontFace: FontFamily.Default,
            fontSize: 72,
            fontStyle: FontStyle.Bold,
            textColor: Colors.stockGreenBright,
          },
        },
        StockChange: {
          y: 148,
          text: {
            text: "+2.45 (+0.57%)",
            fontFace: FontFamily.Default,
            fontSize: FontSize.Large,
            fontStyle: FontStyle.Medium,
            textColor: Colors.stockGreenBright,
          },
        },
      },

      // Time Period Selector
      TimeSelectorContainer: Object.assign(
        {
          x: FRAME_LEFT,
          y: FRAME_TOP + 270,
          w: 320,
          h: 60,
        },
        TIME_PERIODS.reduce(
          (acc: Record<string, object>, period: TimePeriod, index: number) => {
            acc[`TimeButton_${period.id}`] = {
              x: index * 100,
              w: 90,
              h: 50,
              Background: {
                w: 90,
                h: 50,
                rect: true,
                color: Colors.buttonUnfocused,
                shader: {
                  type: Lightning.shaders.RoundedRectangle,
                  radius: 12,
                },
              },
              Label: {
                x: 45,
                y: 25,
                mount: 0.5,
                text: {
                  text: period.label,
                  fontFace: FontFamily.Default,
                  fontSize: FontSize.Body,
                  textColor: Colors.textTertiary,
                  fontStyle: FontStyle.Medium,
                },
              },
            };
            return acc;
          },
          {}
        )
      ),

      // Watchlist Star Button (Add/Remove from watchlist)
      WatchlistStarButton: {
        x: FRAME_LEFT + 320,
        y: FRAME_TOP + 270,
        w: 50,
        h: 50,
        alpha: 0,
        rect: true,
        color: Colors.transparent,
        Background: {
          w: 50,
          h: 50,
          rect: true,
          color: Colors.buttonUnfocused,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: 12,
          },
        },
        StarIcon: {
          x: 25,
          y: 25,
          mount: 0.5,
          text: {
            text: "☆",
            fontFace: FontFamily.Default,
            fontSize: 28,
            textColor: Colors.textTertiary,
          },
        },
      },

      // Chart Container
      ChartContainer: {
        x: FRAME_LEFT,
        y: FRAME_TOP + 370,
        w: 1260,
        h: 600,
        rect: true,
        color: Colors.cardBackground,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
        Chart: {
          type: StockChart,
          w: 1260,
          h: 600,
          chartWidth: 1260,
          chartHeight: 600,
          canvasLeft: FRAME_LEFT,
          canvasTop: FRAME_TOP + 370,
        },
      },

      // Market Indices Panel
      MarketIndicesPanel: {
        x: 1340,
        y: FRAME_TOP + 70,
        alpha: 0,
        w: 520,
        h: 220,
        rect: true,
        color: Colors.cardBackground,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
        Title: {
          x: 25,
          y: 22,
          text: {
            text: "Market Overview",
            fontFace: FontFamily.Default,
            fontSize: 36,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
          },
        },
        // S&P 500
        Index1: {
          x: 25,
          y: 75,
          Symbol: {
            text: {
              text: "S&P 500",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
            },
          },
          Price: {
            x: 170,
            text: {
              text: "$5,876.00",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "+0.85%",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.stockGreenBright,
            },
          },
        },
        // Dow Jones
        Index2: {
          x: 25,
          y: 125,
          Symbol: {
            text: {
              text: "Dow Jones",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
            },
          },
          Price: {
            x: 170,
            text: {
              text: "$42,840.00",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "+0.52%",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.stockGreenBright,
            },
          },
        },
        // Nasdaq
        Index3: {
          x: 25,
          y: 175,
          Symbol: {
            text: {
              text: "Nasdaq",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
            },
          },
          Price: {
            x: 170,
            text: {
              text: "$19,340.00",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "+1.24%",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.stockGreenBright,
            },
          },
        },
      },

      // Stats Panel
      StatsPanel: {
        x: 1340,
        y: FRAME_TOP + 320,
        alpha: 0,
        w: 520,
        h: 420,
        rect: true,
        color: Colors.cardBackground,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
        Title: {
          x: 25,
          y: 22,
          text: {
            text: "Stock Details",
            fontFace: FontFamily.Default,
            fontSize: 36,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
          },
        },
        // Volume
        Stat1: {
          x: 25,
          y: 80,
          Label: {
            text: {
              text: "Volume",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Regular,
              textColor: Colors.textTertiary,
            },
          },
          Value: {
            y: 34,
            text: {
              text: "2.5M",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
        },
        // Market Cap
        Stat2: {
          x: 270,
          y: 80,
          Label: {
            text: {
              text: "Market Cap",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Regular,
              textColor: Colors.textTertiary,
            },
          },
          Value: {
            y: 34,
            text: {
              text: "$523B",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
        },
        Divider1: {
          y: 165,
          x: 25,
          w: 470,
          h: 1,
          rect: true,
          color: Colors.separator,
        },
        // Day Range
        Stat3: {
          x: 25,
          y: 190,
          Label: {
            text: {
              text: "Day Range",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Regular,
              textColor: Colors.textTertiary,
            },
          },
          Value: {
            y: 34,
            text: {
              text: "$615.20 - $618.45",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
        },
        Divider2: {
          y: 280,
          x: 25,
          w: 470,
          h: 1,
          rect: true,
          color: Colors.separator,
        },
        // 52 Week Range
        Stat4: {
          x: 25,
          y: 305,
          Label: {
            text: {
              text: "52 Week Range",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Regular,
              textColor: Colors.textTertiary,
            },
          },
          Value: {
            y: 34,
            text: {
              text: "$485.30 - $633.71",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
        },
        Divider3: {
          y: 395,
          x: 25,
          w: 470,
          h: 1,
          rect: true,
          color: Colors.separator,
        },
      },

      // Watchlist Panel
      WatchlistPanel: {
        x: 1340,
        y: FRAME_TOP + 770,
        alpha: 0,
        w: 520,
        h: 200,
        rect: true,
        color: Colors.cardBackground,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
        Title: {
          x: 25,
          y: 22,
          text: {
            text: "Watchlist",
            fontFace: FontFamily.Default,
            fontSize: 36,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
          },
        },
        // Empty state for non-signed-in users
        EmptyStateNotSignedIn: {
          alpha: 0,
          Icon: {
            x: 260,
            y: 85,
            mount: 0.5,
            text: {
              text: "⭐",
              fontFace: FontFamily.Default,
              fontSize: 32,
              textColor: Colors.textTertiary,
            },
          },
          Message: {
            x: 260,
            y: 115,
            mount: 0.5,
            text: {
              text: "Sign in to track your favorite stocks",
              fontFace: FontFamily.Default,
              fontSize: 20,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
              textAlign: "center",
              wordWrapWidth: 450,
            },
          },
          Subtitle: {
            x: 260,
            y: 145,
            mount: 0.5,
            text: {
              text: "Build a personalized watchlist",
              fontFace: FontFamily.Default,
              fontSize: 18,
              fontStyle: FontStyle.Regular,
              textColor: Colors.textTertiary,
              textAlign: "center",
            },
          },
        },
        // Empty state for signed-in users with no watchlist
        EmptyStateSignedIn: {
          alpha: 0,
          Icon: {
            x: 260,
            y: 85,
            mount: 0.5,
            text: {
              text: "📊",
              fontFace: FontFamily.Default,
              fontSize: 32,
              textColor: Colors.textTertiary,
            },
          },
          Message: {
            x: 260,
            y: 115,
            mount: 0.5,
            text: {
              text: "Your watchlist is empty",
              fontFace: FontFamily.Default,
              fontSize: 20,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
              textAlign: "center",
            },
          },
          Subtitle: {
            x: 260,
            y: 145,
            mount: 0.5,
            text: {
              text: "Search and add stocks to track",
              fontFace: FontFamily.Default,
              fontSize: 18,
              fontStyle: FontStyle.Regular,
              textColor: Colors.textTertiary,
              textAlign: "center",
            },
          },
        },
        // Watchlist items will be dynamically added here
        Stock1: {
          x: 25,
          y: 75,
          alpha: 0,
          Symbol: {
            text: {
              text: "AAPL",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Price: {
            x: 170,
            text: {
              text: "$195.50",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "+2.5%",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.stockGreenBright,
            },
          },
        },
        Stock2: {
          x: 25,
          y: 118,
          alpha: 0,
          Symbol: {
            text: {
              text: "TSLA",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Price: {
            x: 170,
            text: {
              text: "$248.30",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "-1.2%",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.stockRed,
            },
          },
        },
        Stock3: {
          x: 25,
          y: 161,
          alpha: 0,
          Symbol: {
            text: {
              text: "MSFT",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Price: {
            x: 170,
            text: {
              text: "$415.20",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "+0.8%",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.stockGreenBright,
            },
          },
        },
      },
    };
  }

  _init(): void {
    super._init();

    console.log("📊 Initializing Stock Dashboard...");
    console.log(
      `📐 Screen dimensions: ${this.coordsWidth}x${this.coordsHeight} (1080p design)`
    );

    this._updateMarketStatus();
    this._updateMarketIndices();
    this._updateWatchlistStarButton();
    this._updateWatchlist();
    this._loadStockData(this.currentSymbol);
    this._restoreButtonStates();
    this.currentFocusIndex = 1;
    setTimeout(() => {
      this._updateFocus();
    }, 100);
  }

  _attach(): void {
    const chartContainer = this.tag("ChartContainer");
    if (chartContainer) {
      const chart = chartContainer.tag("Chart") as StockChart;
      if (chart && chart.showCanvas) {
        chart.showCanvas();
      }
    }
  }

  _detach(): void {
    const chartContainer = this.tag("ChartContainer");
    if (chartContainer) {
      const chart = chartContainer.tag("Chart") as StockChart;
      if (chart && chart.hideCanvas) {
        chart.hideCanvas();
      }
    }
  }

  async _active(): Promise<void> {
    try {
      console.log(`🚀 Stock Dashboard ready (${this.currentSymbol})`);
      this._updateMarketStatus();
      this._updateMarketIndices();
      this._updateWatchlist();
      this._loadStockData(this.currentSymbol);
      this._restoreButtonStates();
      this._updateFocus();
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
    }
  }

  private _restoreButtonStates(): void {
    this._updateFocus();
  }

  private async _loadStockData(symbol: string): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    console.log(
      `📈 Loading ${symbol} data for period: ${this.currentTimePeriod.id}`
    );

    try {
      const [quote, series] = await Promise.all([
        stocksApi.getQuote(symbol),
        stocksApi.getSeries(symbol, this.currentTimePeriod.id),
      ]);

      if (quote) {
        this.currentPrice = quote.price;
        console.log(`✅ Using REAL Polygon.io price: $${quote.price}`);
      }

      if (series && series.points && series.points.length > 0) {
        const sortedPoints = series.points.slice().sort((a, b) => a.t - b.t);
        const firstPoint = sortedPoints[0];
        const lastPoint = sortedPoints[sortedPoints.length - 1];
        const currentPrice = quote ? quote.price : lastPoint.c;
        const startingPrice = firstPoint.c;

        this.currentChange =
          Math.round((currentPrice - startingPrice) * 100) / 100;
        this.currentChangePct =
          Math.round((this.currentChange / startingPrice) * 10000) / 10000;

        this._updatePriceDisplay();

        console.log(
          `📊 Calculated change for ${
            this.currentTimePeriod.id
          }: $${startingPrice} → $${currentPrice} = ${
            this.currentChange >= 0 ? "+" : ""
          }${this.currentChange} (${(this.currentChangePct * 100).toFixed(2)}%)`
        );

        const chartData = stocksApi.formatSeriesForChart(series);
        if (chartData.length > 0) {
          this._updateChartWithTimestamps(series);
          console.log(
            `✅ Loaded ${chartData.length} chart points from ${series.source}`
          );
        } else {
          console.warn("⚠️ No chart data available, using fallback");
          this._loadFallbackData();
        }
      } else {
        if (quote) {
          this.currentChange = quote.change;
          this.currentChangePct = quote.changePct;
          this._updatePriceDisplay();
        }
        console.warn("⚠️ No series data available, using fallback");
        this._loadFallbackData();
      }
    } catch (error) {
      console.error("❌ Failed to load VOO data:", error);
      this._loadFallbackData();
    } finally {
      this.isLoading = false;
    }
  }

  private _updatePriceDisplay(): void {
    const mainDisplay = this.tag("MainDisplay");
    if (mainDisplay) {
      const priceColor =
        this.currentChange >= 0 ? Colors.stockGreenBright : Colors.stockRed;

      const symbolElement = mainDisplay.tag("StockSymbol");
      if (symbolElement && symbolElement.text) {
        symbolElement.text.text = this.currentSymbol;
      }

      const nameElement = mainDisplay.tag("StockName");
      if (nameElement && nameElement.text) {
        nameElement.text.text = this.currentStockName;
      }

      const priceElement = mainDisplay.tag("StockPrice");
      if (priceElement) {
        priceElement.text.text = stocksApi.formatPrice(this.currentPrice);
        priceElement.text.textColor = priceColor;
      }

      const changeElement = mainDisplay.tag("StockChange");
      if (changeElement) {
        changeElement.text.text = stocksApi.formatChange(
          this.currentChange,
          this.currentChangePct
        );
        changeElement.text.textColor = priceColor;
      }
    }

    this._updateStatsPanel();
  }

  private _updateMarketStatus(): void {
    const now = new Date();

    // Convert to EST time
    const estTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const currentHour = estTime.getHours();
    const currentMinutes = estTime.getMinutes();
    const currentDay = estTime.getDay();

    // Market hours: Monday-Friday, 9:30 AM - 4:00 PM EST
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const afterOpen =
      currentHour > 9 || (currentHour === 9 && currentMinutes >= 30);
    const beforeClose = currentHour < 16;
    const isOpen = isWeekday && afterOpen && beforeClose;

    const marketStatus = this.tag("MarketStatus");
    if (marketStatus) {
      const statusDot = marketStatus.tag("StatusDot");
      const statusText = marketStatus.tag("StatusText");
      const separator = marketStatus.tag("Separator");
      const timeText = marketStatus.tag("TimeText");

      if (statusDot) {
        statusDot.color = isOpen ? Colors.stockGreenBright : Colors.stockRed;
      }

      if (statusText && statusText.text) {
        const statusMessage = isOpen ? "Market Open" : "Market Closed";
        statusText.text.text = statusMessage;
        statusText.text.textColor = Colors.textPrimary;

        // Dynamically position separator and time text based on status text width
        // "Market Open" ≈ 122px, "Market Closed" ≈ 145px at 20px font
        const separatorX = isOpen ? 150 : 165;
        const timeTextX = isOpen ? 164 : 179;

        if (separator) {
          separator.x = separatorX;
        }

        if (timeText) {
          timeText.x = timeTextX;
        }
      }
    }
  }

  private async _updateMarketIndices(): Promise<void> {
    const FRAME_TOP = 50;
    const panel = this.tag("MarketIndicesPanel");
    if (!panel) return;

    panel.setSmooth("alpha", 1, { duration: 0.6, delay: 0.2 });
    panel.setSmooth("y", FRAME_TOP + 70, { duration: 0.6, delay: 0.2 });

    // Fetch real market data for major indices
    try {
      console.log("📊 Fetching real market indices data...");
      const [spyQuote, diaQuote, qqqQuote] = await Promise.all([
        stocksApi.getQuote("SPY"), // S&P 500 ETF
        stocksApi.getQuote("DIA"), // Dow Jones ETF
        stocksApi.getQuote("QQQ"), // Nasdaq ETF
      ]);

      // Update marketIndices array with real data
      if (spyQuote) {
        this.marketIndices[0] = {
          symbol: "SPY",
          name: "S&P 500",
          price: spyQuote.price,
          change: spyQuote.change,
          changePct: spyQuote.changePct,
        };
      }

      if (diaQuote) {
        this.marketIndices[1] = {
          symbol: "DIA",
          name: "Dow Jones",
          price: diaQuote.price,
          change: diaQuote.change,
          changePct: diaQuote.changePct,
        };
      }

      if (qqqQuote) {
        this.marketIndices[2] = {
          symbol: "QQQ",
          name: "Nasdaq",
          price: qqqQuote.price,
          change: qqqQuote.change,
          changePct: qqqQuote.changePct,
        };
      }

      // Update UI with fetched data
      this.marketIndices.forEach((index, i) => {
        const indexElement = panel.tag(`Index${i + 1}`);
        if (!indexElement) return;

        const priceElement = indexElement.tag("Price");
        if (priceElement && priceElement.text) {
          priceElement.text.text = stocksApi.formatPrice(index.price);
        }

        const changeElement = indexElement.tag("Change");
        if (changeElement && changeElement.text) {
          const changeColor =
            index.change >= 0 ? Colors.stockGreenBright : Colors.stockRed;
          const sign = index.change >= 0 ? "+" : "";
          changeElement.text.text = `${sign}${(index.changePct * 100).toFixed(
            2
          )}%`;
          changeElement.text.textColor = changeColor;
        }
      });

      console.log("✅ Market indices updated with real data");
    } catch (error) {
      console.error("❌ Failed to fetch market indices:", error);
      // Fall back to displaying existing hardcoded data if API fails
      this.marketIndices.forEach((index, i) => {
        const indexElement = panel.tag(`Index${i + 1}`);
        if (!indexElement) return;

        const priceElement = indexElement.tag("Price");
        if (priceElement && priceElement.text) {
          priceElement.text.text = stocksApi.formatPrice(index.price);
        }

        const changeElement = indexElement.tag("Change");
        if (changeElement && changeElement.text) {
          const changeColor =
            index.change >= 0 ? Colors.stockGreenBright : Colors.stockRed;
          const sign = index.change >= 0 ? "+" : "";
          changeElement.text.text = `${sign}${(index.changePct * 100).toFixed(
            2
          )}%`;
          changeElement.text.textColor = changeColor;
        }
      });
    }
  }

  private async _updateStatsPanel(): Promise<void> {
    const FRAME_TOP = 50;
    const statsPanel = this.tag("StatsPanel");
    if (!statsPanel) return;

    statsPanel.setSmooth("alpha", 1, { duration: 0.6, delay: 0.4 });
    statsPanel.setSmooth("y", FRAME_TOP + 320, { duration: 0.6, delay: 0.4 });

    try {
      console.log(`📊 Fetching real metrics for ${this.currentSymbol}...`);

      // Fetch real stock metrics and quote in parallel
      const [metrics, quote] = await Promise.all([
        stocksApi.getMetrics(this.currentSymbol),
        stocksApi.getQuote(this.currentSymbol),
      ]);

      // Volume (from metrics)
      const volume =
        metrics && metrics.volume ? this._formatVolume(metrics.volume) : "N/A";

      // Market Cap (from metrics)
      const marketCap =
        metrics && metrics.marketCap
          ? this._formatMarketCap(metrics.marketCap)
          : "N/A";

      // Day Range (from quote's dayHigh and dayLow)
      let dayRange = "N/A";
      if (quote && quote.dayLow !== undefined && quote.dayHigh !== undefined) {
        dayRange = `${stocksApi.formatPrice(
          quote.dayLow
        )} - ${stocksApi.formatPrice(quote.dayHigh)}`;
      }

      // 52-Week Range (from metrics)
      let week52Range = "N/A";
      if (
        metrics &&
        metrics.week52Low !== undefined &&
        metrics.week52High !== undefined
      ) {
        week52Range = `${stocksApi.formatPrice(
          metrics.week52Low
        )} - ${stocksApi.formatPrice(metrics.week52High)}`;
      }

      // Update UI
      const stat1Value =
        statsPanel.tag("Stat1") && statsPanel.tag("Stat1").tag("Value");
      if (stat1Value && stat1Value.text) {
        stat1Value.text.text = volume;
      }

      const stat2Value =
        statsPanel.tag("Stat2") && statsPanel.tag("Stat2").tag("Value");
      if (stat2Value && stat2Value.text) {
        stat2Value.text.text = marketCap;
      }

      const stat3Value =
        statsPanel.tag("Stat3") && statsPanel.tag("Stat3").tag("Value");
      if (stat3Value && stat3Value.text) {
        stat3Value.text.text = dayRange;
      }

      const stat4Value =
        statsPanel.tag("Stat4") && statsPanel.tag("Stat4").tag("Value");
      if (stat4Value && stat4Value.text) {
        stat4Value.text.text = week52Range;
      }

      console.log(
        `✅ Stats panel updated with real data for ${this.currentSymbol}`
      );
    } catch (error) {
      console.error(`❌ Failed to update stats panel:`, error);

      // Fall back to N/A values
      const stat1Value =
        statsPanel.tag("Stat1") && statsPanel.tag("Stat1").tag("Value");
      if (stat1Value && stat1Value.text) stat1Value.text.text = "N/A";

      const stat2Value =
        statsPanel.tag("Stat2") && statsPanel.tag("Stat2").tag("Value");
      if (stat2Value && stat2Value.text) stat2Value.text.text = "N/A";

      const stat3Value =
        statsPanel.tag("Stat3") && statsPanel.tag("Stat3").tag("Value");
      if (stat3Value && stat3Value.text) stat3Value.text.text = "N/A";

      const stat4Value =
        statsPanel.tag("Stat4") && statsPanel.tag("Stat4").tag("Value");
      if (stat4Value && stat4Value.text) stat4Value.text.text = "N/A";
    }
  }

  private _formatVolume(volume: number): string {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  private _formatMarketCap(marketCap: number): string {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(0)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(0)}M`;
    }
    return `$${marketCap.toString()}`;
  }

  /**
   * Updates the watchlist panel based on user authentication and watchlist state
   *
   * Three possible states:
   * 1. Not signed in: Show prompt to sign in with star icon
   * 2. Signed in but empty watchlist: Show message to add stocks with chart icon
   * 3. Signed in with items: Display up to 3 watchlist stocks with prices/changes
   */
  private _updateWatchlist(): void {
    const FRAME_TOP = 50;
    const watchlistPanel = this.tag("WatchlistPanel");
    if (!watchlistPanel) {
      return;
    }

    // Animate panel appearance
    watchlistPanel.setSmooth("alpha", 1, { duration: 0.6, delay: 0.6 });
    watchlistPanel.setSmooth("y", FRAME_TOP + 770, {
      duration: 0.6,
      delay: 0.6,
    });

    // Check authentication status
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    // Check if user has watchlist items
    const hasWatchlistItems = this._hasWatchlistItems();

    // Get all UI elements
    const emptyStateNotSignedIn = watchlistPanel.tag("EmptyStateNotSignedIn");
    const emptyStateSignedIn = watchlistPanel.tag("EmptyStateSignedIn");
    const stock1 = watchlistPanel.tag("Stock1");
    const stock2 = watchlistPanel.tag("Stock2");
    const stock3 = watchlistPanel.tag("Stock3");

    // Hide all states initially
    if (emptyStateNotSignedIn) {
      emptyStateNotSignedIn.alpha = 0;
    }
    if (emptyStateSignedIn) {
      emptyStateSignedIn.alpha = 0;
    }
    if (stock1) {
      stock1.alpha = 0;
    }
    if (stock2) {
      stock2.alpha = 0;
    }
    if (stock3) {
      stock3.alpha = 0;
    }

    // Determine which state to show
    if (!isLoggedIn) {
      // State 1: User not signed in - show sign-in prompt
      console.log("📊 Watchlist: Showing sign-in prompt");
      if (emptyStateNotSignedIn) {
        emptyStateNotSignedIn.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }
    } else if (!hasWatchlistItems) {
      // State 2: User signed in but watchlist is empty
      console.log("📊 Watchlist: Showing empty watchlist message");
      if (emptyStateSignedIn) {
        emptyStateSignedIn.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }
    } else {
      // State 3: User signed in and has watchlist items - show them
      console.log("📊 Watchlist: Showing user's stocks");
      const watchlist = this._getUserWatchlist();
      const stockElements = [stock1, stock2, stock3];

      // Fetch real-time data for watchlist stocks
      this._updateWatchlistPrices(watchlist.slice(0, 3), stockElements);
    }
  }

  private _updateChart(data: number[]): void {
    const chartContainer = this.tag("ChartContainer");
    if (chartContainer) {
      const chartComponent = chartContainer.tag("Chart") as StockChart;
      if (chartComponent) {
        chartComponent.points = data;
        chartComponent.lineColor =
          this.currentChange >= 0 ? "#00ff88" : "#ff4444";
      }
    }
  }

  private _updateChartWithTimestamps(seriesData: ISeriesData): void {
    const chartContainer = this.tag("ChartContainer");
    if (chartContainer) {
      const chartComponent = chartContainer.tag("Chart") as StockChart;
      if (chartComponent) {
        chartComponent.seriesData = seriesData;
        chartComponent.lineColor =
          this.currentChange >= 0 ? "#00ff88" : "#ff4444";
      }
    }
  }

  private _loadFallbackData(): void {
    const basePrice = 615.3;
    const pointCount =
      this.currentTimePeriod.days === 1
        ? 50
        : this.currentTimePeriod.days <= 30
        ? 100
        : 200;

    const fallbackData: number[] = [];
    const seed = this.currentTimePeriod.id.charCodeAt(0);
    let seededRandom = seed;
    const deterministicRandom = () => {
      seededRandom = (seededRandom * 9301 + 49297) % 233280;
      return seededRandom / 233280;
    };

    for (let i = 0; i < pointCount; i++) {
      const timeProgress = i / pointCount;
      const periodMultiplier =
        {
          "1D": 0.002,
          "1W": 0.005,
          "1M": 0.015,
          "3M": 0.03,
          "1Y": 0.08,
        }[this.currentTimePeriod.id] || 0.01;

      const trendDirection =
        this.currentTimePeriod.id === "1Y"
          ? 1
          : deterministicRandom() > 0.5
          ? 1
          : -1;
      const overallTrend =
        trendDirection * periodMultiplier * timeProgress * 0.3;
      const marketCycle =
        Math.sin(timeProgress * Math.PI * 2) * periodMultiplier * 0.4;
      const volatility = (deterministicRandom() - 0.5) * periodMultiplier * 0.8;
      const dailyVariation =
        Math.sin(timeProgress * Math.PI * 20) * periodMultiplier * 0.1;

      let price =
        basePrice *
        (1 + overallTrend + marketCycle + volatility + dailyVariation);
      price = Math.max(580, Math.min(650, price));
      fallbackData.push(Math.round(price * 100) / 100);
    }

    const latestPrice = fallbackData[fallbackData.length - 1];
    const previousPrice = fallbackData[fallbackData.length - 2];

    this.currentPrice = latestPrice;
    this.currentChange = latestPrice - previousPrice;
    this.currentChangePct = this.currentChange / previousPrice;
    this._updatePriceDisplay();

    this._updateChart(fallbackData);
    console.log("📊 Using realistic VOO fallback data matching backend");
  }

  _handleUp(): boolean {
    if (this.currentFocusIndex === 0) {
      const searchBar = this.tag("SearchBar") as SearchBar;
      const searchResults = this.tag("SearchResults") as SearchResults;

      if (searchBar && searchResults && this.searchResults.length > 0) {
        if (searchResults._handleUp && searchResults._handleUp()) {
          this.selectedSearchIndex = searchResults.getSelectedIndex();
          if (searchBar.setSelectedIndex) {
            searchBar.setSelectedIndex(this.selectedSearchIndex);
          }
          return true;
        }
      }
      return false;
    } else if (this.currentFocusIndex === 1) {
      // From Sign In button, go to Search
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex >= 2) {
      // From time period buttons, go to Sign In button
      this.currentFocusIndex = 1;
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.currentFocusIndex === 0) {
      const searchBar = this.tag("SearchBar") as SearchBar;
      const searchResults = this.tag("SearchResults") as SearchResults;

      if (searchBar && searchResults && this.searchResults.length > 0) {
        if (searchResults._handleDown && searchResults._handleDown()) {
          this.selectedSearchIndex = searchResults.getSelectedIndex();
          if (searchBar.setSelectedIndex) {
            searchBar.setSelectedIndex(this.selectedSearchIndex);
          }
          return true;
        }
      }
      // From Search, go to Sign In button
      this.currentFocusIndex = 1;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 1) {
      // From Sign In button, go to first time period button
      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleLeft(): boolean {
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    if (this.currentFocusIndex === 1) {
      // From Sign In button, go to Search
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length) {
      // From star button, go to last time button
      this.currentFocusIndex = 2 + TIME_PERIODS.length - 1;
      this._updateFocus();
      return true;
    } else if (
      this.currentFocusIndex >= 3 &&
      this.currentFocusIndex <= 2 + TIME_PERIODS.length - 1
    ) {
      // Navigate left through time period buttons
      const currentButtonIndex = this.currentFocusIndex - 2;
      if (currentButtonIndex > 0) {
        this.currentFocusIndex--;
        this._updateFocus();
      }
      return true;
    } else if (this.currentFocusIndex === 2) {
      // From first time button, wrap to star button if logged in, otherwise to last time button
      if (isLoggedIn) {
        this.currentFocusIndex = 2 + TIME_PERIODS.length;
        this._updateFocus();
      } else {
        this.currentFocusIndex = 2 + TIME_PERIODS.length - 1;
        this._updateFocus();
      }
      return true;
    }
    return false;
  }

  _handleRight(): boolean {
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    if (this.currentFocusIndex === 0) {
      // From Search, go to Sign In button
      this.currentFocusIndex = 1;
      this._updateFocus();
      return true;
    } else if (
      this.currentFocusIndex >= 2 &&
      this.currentFocusIndex < 2 + TIME_PERIODS.length - 1
    ) {
      // Navigate right through time period buttons
      this.currentFocusIndex++;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length - 1) {
      // From last time button, go to star button if logged in, otherwise wrap
      if (isLoggedIn) {
        this.currentFocusIndex = 2 + TIME_PERIODS.length;
        this._updateFocus();
      } else {
        this.currentFocusIndex = 2;
        this._updateFocus();
      }
      return true;
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length) {
      // From star button, wrap to first time button
      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleEnter(): boolean {
    if (this.currentFocusIndex === 0) {
      const searchBar = this.tag("SearchBar") as SearchBar;
      const searchResults = this.tag("SearchResults") as SearchResults;

      if (searchBar && searchResults && this.searchResults.length > 0) {
        const selectedResult = searchResults.getSelectedResult();
        if (selectedResult) {
          this._selectStock(selectedResult.symbol, selectedResult.name);
          return true;
        }
      }
      return false;
    } else if (this.currentFocusIndex === 1) {
      console.log("🔐 Opening Account/Auth screen");
      this.fireAncestors("$showAuthFlow");
      return true;
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length) {
      // Star button pressed - toggle watchlist
      console.log("⭐ Toggling watchlist for", this.currentSymbol);
      this._toggleWatchlist();
      return true;
    } else {
      const buttonIndex = this.currentFocusIndex - 2;
      if (buttonIndex >= 0 && buttonIndex < TIME_PERIODS.length) {
        this._selectTimePeriod(buttonIndex);
        return true;
      }
    }
    return false;
  }

  updateAuthButton(isLoggedIn: boolean): void {
    const signInButton = this.tag("SignInButton");
    if (!signInButton) return;

    const icon = signInButton.tag("Icon");
    if (icon && icon.text) {
      icon.text.text = isLoggedIn ? "⚙" : "👤";
    }

    this.stage.update();
  }

  _handleKey(event: KeyboardEvent): boolean {
    if (this.currentFocusIndex === 0) {
      const searchBar = this.tag("SearchBar");
      if (searchBar) {
        return false;
      }
    }
    return false;
  }

  private _selectTimePeriod(newIndex: number): void {
    const oldPeriod = TIME_PERIODS[this.selectedPeriodIndex];
    const newPeriod = TIME_PERIODS[newIndex];

    this.selectedPeriodIndex = newIndex;
    this.currentTimePeriod = newPeriod;

    this._updateFocus();

    console.log(`🕐 Time period changed to: ${newPeriod.label}`);
    this._loadStockData(this.currentSymbol);
  }

  private _showSearchResults(): void {
    const resultsContainer = this.tag("SearchResults") as SearchResults;
    if (!resultsContainer) return;

    resultsContainer.setSmooth("alpha", 1, { duration: 0.2 });

    if (resultsContainer.setResults) {
      resultsContainer.setResults(this.searchResults);
      resultsContainer.setSelectedIndex(this.selectedSearchIndex);
    }
  }

  private _updateSearchSelection(): void {
    const resultsContainer = this.tag("SearchResults") as SearchResults;
    if (!resultsContainer) return;

    if (resultsContainer.setSelectedIndex) {
      resultsContainer.setSelectedIndex(this.selectedSearchIndex);
    }
  }

  private _clearSearchResults(): void {
    const resultsContainer = this.tag("SearchResults") as SearchResults;
    if (resultsContainer) {
      resultsContainer.setSmooth("alpha", 0, { duration: 0.2 });
      if (resultsContainer.clearResults) {
        resultsContainer.clearResults();
      }
    }
    this.searchResults = [];
  }

  private async _selectStock(symbol: string, name: string): Promise<void> {
    console.log(`✅ Selected stock: ${symbol} - ${name}`);

    this.currentSymbol = symbol;
    this.currentStockName = name;

    const mainDisplay = this.tag("MainDisplay");
    if (mainDisplay) {
      const titleElement = mainDisplay.tag("StockSymbol");
      if (titleElement) {
        titleElement.text.text = `${symbol} - ${name}`;
      }
    }

    const searchBar = this.tag("SearchBar") as SearchBar;
    if (searchBar && searchBar._unfocus) {
      searchBar._unfocus();
    }

    this.currentFocusIndex = 1;
    this._updateFocus();

    // Update star button to reflect new stock's watchlist status
    this._updateWatchlistStarButton();

    await this._loadStockData(symbol);
  }

  _getFocused(): Lightning.Component {
    if (this.currentFocusIndex === 0) {
      const searchBar = this.tag("SearchBar");
      if (searchBar) {
        return searchBar as Lightning.Component;
      }
    } else if (this.currentFocusIndex === 1) {
      return this as Lightning.Component;
    }
    return this as Lightning.Component;
  }

  private _updateFocus(): void {
    const searchBar = this.tag("SearchBar") as SearchBar;
    if (searchBar) {
      if (this.currentFocusIndex === 0) {
        if (searchBar._focus) searchBar._focus();
      } else {
        if (searchBar._unfocus) searchBar._unfocus();
      }
    }

    const signInButton = this.tag("SignInButton");
    if (signInButton) {
      const background = signInButton.tag("Background");
      if (background) {
        if (this.currentFocusIndex === 1) {
          background.setSmooth("color", Colors.buttonFocused, {
            duration: 0.3,
          });
        } else {
          background.setSmooth("color", Colors.buttonUnfocused, {
            duration: 0.3,
          });
        }
      }
    }

    const container = this.tag("TimeSelectorContainer");
    if (container) {
      TIME_PERIODS.forEach((period, index) => {
        const button = container.tag(`TimeButton_${period.id}`);
        if (button) {
          const isFocused = this.currentFocusIndex === index + 2;
          const isSelected = index === this.selectedPeriodIndex;
          const background = button.tag("Background");
          const label = button.tag("Label");

          if (background) {
            if (isFocused && isSelected) {
              background.setSmooth("color", Colors.stockGreenBright, {
                duration: 0.3,
              });
              if (label && label.text) {
                label.text.textColor = Colors.black;
              }
            } else if (isSelected) {
              background.setSmooth("color", Colors.authAccent, {
                duration: 0.3,
              });
              if (label && label.text) {
                label.text.textColor = Colors.white;
              }
            } else if (isFocused) {
              background.setSmooth("color", Colors.buttonHover, {
                duration: 0.3,
              });
              if (label && label.text) {
                label.text.textColor = Colors.textPrimary;
              }
            } else {
              background.setSmooth("color", Colors.buttonUnfocused, {
                duration: 0.3,
              });
              if (label && label.text) {
                label.text.textColor = Colors.textTertiary;
              }
            }
          }
        }
      });
    }

    // Update star button focus
    const starButton = this.tag("WatchlistStarButton");
    if (starButton) {
      const background = starButton.tag("Background");
      const starIcon = starButton.tag("StarIcon");
      const isFocused = this.currentFocusIndex === 2 + TIME_PERIODS.length;

      if (background) {
        if (isFocused) {
          background.setSmooth("color", Colors.buttonFocused, {
            duration: 0.3,
          });
        } else {
          background.setSmooth("color", Colors.buttonUnfocused, {
            duration: 0.3,
          });
        }
      }
    }

    this.stage.update();
  }

  $searchActivated(event: ISearchActivatedEvent): void {
    this.isSearchActive = true;
    console.log("🔍 Search activated from SearchBar component");
  }

  $searchDeactivated(event: ISearchDeactivatedEvent): void {
    this.isSearchActive = false;
    this.searchResults = [];
    this._clearSearchResults();
    console.log("🔍 Search deactivated from SearchBar component");
  }

  $showSearchResults(event: IShowSearchResultsEvent): void {
    this.searchResults = event.results || [];
    this.selectedSearchIndex = event.selectedIndex || 0;
    const searchResults = this.tag("SearchResults") as SearchResults;
    if (searchResults && searchResults.setResults) {
      searchResults.setResults(this.searchResults);
      searchResults.setSelectedIndex(this.selectedSearchIndex);
    }
    const resultsContainer = this.tag("SearchResults");
    if (resultsContainer) {
      resultsContainer.setSmooth("alpha", 1, { duration: 0.2 });
    }
  }

  $updateSearchSelection(event: IUpdateSearchSelectionEvent): void {
    this.selectedSearchIndex = event.selectedIndex || 0;
    const searchResults = this.tag("SearchResults") as SearchResults;
    if (searchResults && searchResults.setSelectedIndex) {
      searchResults.setSelectedIndex(this.selectedSearchIndex);
    }
  }

  $navigateSearchResultsUp(event: INavigateSearchResultsEvent): void {
    const searchResults = this.tag("SearchResults") as SearchResults;
    if (searchResults && searchResults._handleUp) {
      searchResults._handleUp();
      this.selectedSearchIndex = searchResults.getSelectedIndex();
      const searchBar = this.tag("SearchBar") as SearchBar;
      if (searchBar && searchBar.setSelectedIndex) {
        searchBar.setSelectedIndex(this.selectedSearchIndex);
      }
    }
  }

  $navigateSearchResultsDown(event: INavigateSearchResultsEvent): void {
    const searchResults = this.tag("SearchResults") as SearchResults;
    if (searchResults && searchResults._handleDown) {
      searchResults._handleDown();
      this.selectedSearchIndex = searchResults.getSelectedIndex();
      const searchBar = this.tag("SearchBar") as SearchBar;
      if (searchBar && searchBar.setSelectedIndex) {
        searchBar.setSelectedIndex(this.selectedSearchIndex);
      }
    }
  }

  $clearSearchResults(): void {
    this._clearSearchResults();
  }

  $selectStock(event: ISelectStockEvent): void {
    if (event && event.symbol && event.name) {
      this._selectStock(event.symbol, event.name);
    }
  }

  $authenticationSuccess(): void {
    console.log("🔐 User authenticated, refreshing watchlist");
    this._updateWatchlistStarButton();
    this._updateWatchlist();
  }

  $signOut(): void {
    console.log("🚪 User signed out, clearing watchlist");
    this._updateWatchlistStarButton();
    this._updateWatchlist();
  }

  /**
   * Retrieves user's watchlist from localStorage
   * @returns Array of stock symbols in the watchlist
   */
  private _getUserWatchlist(): string[] {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return [];
      }

      const watchlistData = localStorage.getItem("user_watchlist");
      if (!watchlistData) {
        return [];
      }

      const watchlist = JSON.parse(watchlistData);
      return Array.isArray(watchlist) ? watchlist : [];
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      return [];
    }
  }

  /**
   * Checks if user has any items in their watchlist
   * @returns true if watchlist has items, false otherwise
   */
  private _hasWatchlistItems(): boolean {
    const watchlist = this._getUserWatchlist();
    return watchlist && watchlist.length > 0;
  }

  /**
   * Saves watchlist to localStorage
   * @param watchlist Array of stock symbols
   */
  private _saveWatchlist(watchlist: string[]): void {
    try {
      localStorage.setItem("user_watchlist", JSON.stringify(watchlist));
      console.log("💾 Watchlist saved:", watchlist);
    } catch (error) {
      console.error("Failed to save watchlist:", error);
    }
  }

  /**
   * Checks if current stock is in the watchlist
   * @returns true if current stock is in watchlist
   */
  private _isInWatchlist(): boolean {
    const watchlist = this._getUserWatchlist();
    return watchlist.includes(this.currentSymbol);
  }

  /**
   * Adds current stock to watchlist
   */
  private _addToWatchlist(): void {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("⚠️ User not signed in, cannot add to watchlist");
      return;
    }

    const watchlist = this._getUserWatchlist();
    if (watchlist.includes(this.currentSymbol)) {
      console.log(`ℹ️ ${this.currentSymbol} already in watchlist`);
      return;
    }

    watchlist.push(this.currentSymbol);
    this._saveWatchlist(watchlist);
    this._updateWatchlistStarButton();
    this._updateWatchlist();
    console.log(`⭐ Added ${this.currentSymbol} to watchlist`);
  }

  /**
   * Removes current stock from watchlist
   */
  private _removeFromWatchlist(): void {
    const watchlist = this._getUserWatchlist();
    const index = watchlist.indexOf(this.currentSymbol);

    if (index === -1) {
      console.log(`ℹ️ ${this.currentSymbol} not in watchlist`);
      return;
    }

    watchlist.splice(index, 1);
    this._saveWatchlist(watchlist);
    this._updateWatchlistStarButton();
    this._updateWatchlist();
    console.log(`☆ Removed ${this.currentSymbol} from watchlist`);
  }

  /**
   * Toggles current stock in/out of watchlist
   */
  private _toggleWatchlist(): void {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("⚠️ User not signed in");
      return;
    }

    if (this._isInWatchlist()) {
      this._removeFromWatchlist();
    } else {
      this._addToWatchlist();
    }
  }

  /**
   * Updates the watchlist star button visibility and appearance
   */
  private _updateWatchlistStarButton(): void {
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;
    const starButton = this.tag("WatchlistStarButton");

    if (!starButton) {
      return;
    }

    if (!isLoggedIn) {
      // Hide star button if not logged in
      starButton.setSmooth("alpha", 0, { duration: 0.3 });
      return;
    }

    // Show star button if logged in
    starButton.setSmooth("alpha", 1, { duration: 0.3 });

    const starIcon = starButton.tag("StarIcon");
    if (!starIcon || !starIcon.text) {
      return;
    }

    const isInWatchlist = this._isInWatchlist();

    if (isInWatchlist) {
      // Filled yellow star
      starIcon.text.text = "★";
      starIcon.text.textColor = 0xffffd700; // Gold/yellow
    } else {
      // Empty star with border
      starIcon.text.text = "☆";
      starIcon.text.textColor = Colors.textTertiary;
    }
  }

  /**
   * Fetches and displays real-time prices for watchlist stocks
   * @param watchlist Array of stock symbols (max 3)
   * @param stockElements Array of UI elements to display stocks
   */
  private async _updateWatchlistPrices(
    watchlist: string[],
    stockElements: (Lightning.Component | null)[]
  ): Promise<void> {
    try {
      console.log(
        "📊 Fetching real-time data for watchlist stocks...",
        watchlist
      );

      // Fetch quotes for all watchlist stocks in parallel
      const quotePromises = watchlist.map((symbol) =>
        stocksApi.getQuote(symbol)
      );
      const quotes = await Promise.all(quotePromises);

      // Update UI for each stock
      quotes.forEach((quote, index) => {
        const stockElement = stockElements[index];
        if (!stockElement) {
          return;
        }

        // Update stock symbol
        const symbolTag = stockElement.tag("Symbol");
        if (symbolTag && symbolTag.text && quote) {
          symbolTag.text.text = quote.symbol;
        }

        // Update price
        const priceTag = stockElement.tag("Price");
        if (priceTag && priceTag.text) {
          if (quote) {
            priceTag.text.text = stocksApi.formatPrice(quote.price);
          } else {
            priceTag.text.text = "$---";
          }
        }

        // Update change percentage
        const changeTag = stockElement.tag("Change");
        if (changeTag && changeTag.text) {
          if (quote) {
            const changePct = (quote.changePct * 100).toFixed(2);
            const sign = quote.change >= 0 ? "+" : "";
            changeTag.text.text = `${sign}${changePct}%`;
            changeTag.text.textColor =
              quote.change >= 0 ? Colors.stockGreen : Colors.stockRed;
          } else {
            changeTag.text.text = "--%";
            changeTag.text.textColor = Colors.textTertiary;
          }
        }

        // Show the element with staggered animation
        stockElement.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8 + index * 0.1,
        });
      });

      console.log("✅ Watchlist prices updated with real data");
    } catch (error) {
      console.error("❌ Failed to fetch watchlist prices:", error);

      // Show elements with placeholder data if fetch fails
      watchlist.forEach((symbol, index) => {
        const stockElement = stockElements[index];
        if (!stockElement) {
          return;
        }

        const symbolTag = stockElement.tag("Symbol");
        if (symbolTag && symbolTag.text) {
          symbolTag.text.text = symbol;
        }

        const priceTag = stockElement.tag("Price");
        if (priceTag && priceTag.text) {
          priceTag.text.text = "$---";
        }

        const changeTag = stockElement.tag("Change");
        if (changeTag && changeTag.text) {
          changeTag.text.text = "--%";
          changeTag.text.textColor = Colors.textTertiary;
        }

        stockElement.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8 + index * 0.1,
        });
      });
    }
  }
}
