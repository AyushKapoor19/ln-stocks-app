import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import StockChart from "../components/charts/StockChart";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import WatchlistPanel from "../components/WatchlistPanel";
import { stocksApi } from "../services/api";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import { StockUtils } from "../utils/StockUtils";
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
  private currentPrice = 0;
  private currentChange = 0;
  private currentChangePct = 0;
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
    "WatchlistPanel",
  ];
  private marketIndices: MarketIndex[] = [
    {
      symbol: "SPY",
      name: "S&P 500",
      price: 0,
      change: 0,
      changePct: 0,
    },
    {
      symbol: "DIA",
      name: "Dow Jones",
      price: 0,
      change: 0,
      changePct: 0,
    },
    {
      symbol: "QQQ",
      name: "Nasdaq",
      price: 0,
      change: 0,
      changePct: 0,
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
            text: "Loading...",
            fontFace: FontFamily.Default,
            fontSize: 72,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
          },
        },
        StockChange: {
          y: 148,
          text: {
            text: "--",
            fontFace: FontFamily.Default,
            fontSize: FontSize.Large,
            fontStyle: FontStyle.Medium,
            textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "--",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "--",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textPrimary,
            },
          },
          Change: {
            x: 360,
            text: {
              text: "--",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Body,
              fontStyle: FontStyle.Medium,
              textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textSecondary,
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
              text: "Loading...",
              fontFace: FontFamily.Default,
              fontSize: FontSize.Large,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.textSecondary,
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
        type: WatchlistPanel,
        x: 1340,
        y: FRAME_TOP + 770,
        alpha: 0,
      },
    };
  }

  _init(): void {
    super._init();

    console.log("Initializing Stock Dashboard...");
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
      console.log(`Stock Dashboard ready (${this.currentSymbol})`);
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
          console.warn("⚠️ No chart data available");
        }
      } else {
        if (quote) {
          this.currentChange = quote.change;
          this.currentChangePct = quote.changePct;
          this._updatePriceDisplay();
        }
        console.warn("⚠️ No series data available");
      }
    } catch (error) {
      console.error("❌ Failed to load stock data:", error);
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
    const status = StockUtils.getMarketStatus();
    const layout = StockUtils.getMarketStatusLayout(status.isOpen);

    const marketStatus = this.tag("MarketStatus");
    if (marketStatus) {
      const statusDot = marketStatus.tag("StatusDot");
      const statusText = marketStatus.tag("StatusText");
      const separator = marketStatus.tag("Separator");
      const timeText = marketStatus.tag("TimeText");

      if (statusDot) {
        statusDot.color = status.isOpen
          ? Colors.stockGreenBright
          : Colors.stockRed;
      }

      if (statusText && statusText.text) {
        statusText.text.text = status.statusText;
        statusText.text.textColor = Colors.textPrimary;

        if (separator) {
          separator.x = layout.separatorX;
        }

        if (timeText) {
          timeText.x = layout.timeTextX;
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
      console.log("Fetching real market indices data...");
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
      console.log(`Fetching real metrics for ${this.currentSymbol}...`);

      // Fetch real stock metrics and quote in parallel
      const [metrics, quote] = await Promise.all([
        stocksApi.getMetrics(this.currentSymbol),
        stocksApi.getQuote(this.currentSymbol),
      ]);

      // Volume (from metrics)
      const volume =
        metrics && metrics.volume
          ? StockUtils.formatVolume(metrics.volume)
          : "N/A";

      // Market Cap (from metrics)
      const marketCap =
        metrics && metrics.marketCap
          ? StockUtils.formatMarketCap(metrics.marketCap)
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

  /**
   * Updates the watchlist panel
   */
  private _updateWatchlist(): void {
    const FRAME_TOP = 50;
    const watchlistPanel = this.tag("WatchlistPanel") as WatchlistPanel;
    if (!watchlistPanel) {
      return;
    }

    // Animate panel appearance
    watchlistPanel.setSmooth("alpha", 1, { duration: 0.6, delay: 0.6 });
    watchlistPanel.setSmooth("y", FRAME_TOP + 770, {
      duration: 0.6,
      delay: 0.6,
    });

    // Update watchlist content
    if (watchlistPanel.update) {
      watchlistPanel.update();
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
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length + 1) {
      // From watchlist, try to navigate within it first
      const watchlist = this.tag("WatchlistPanel") as WatchlistPanel;
      if (watchlist && watchlist.handleUp()) {
        return true;
      }
      // If at top of watchlist, go back to star button
      this.currentFocusIndex = 2 + TIME_PERIODS.length;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex >= 2) {
      // From time period buttons or star, go to Sign In button
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
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length) {
      // From star button, try to go to watchlist if user has stocks
      const token = localStorage.getItem("auth_token");
      const watchlistData = localStorage.getItem("user_watchlist");

      console.log("🔍 Attempting to focus watchlist:", {
        hasToken: !!token,
        hasWatchlistData: !!watchlistData,
        currentFocus: this.currentFocusIndex,
      });

      if (token && watchlistData) {
        try {
          const watchlist = JSON.parse(watchlistData);
          if (Array.isArray(watchlist) && watchlist.length > 0) {
            console.log(
              "✅ Focusing watchlist with",
              watchlist.length,
              "stocks"
            );
            this.currentFocusIndex = 2 + TIME_PERIODS.length + 1;
            this._updateFocus();
            return true;
          } else {
            console.log("📭 Watchlist is empty");
          }
        } catch (error) {
          console.error("❌ Error parsing watchlist:", error);
        }
      } else {
        if (!token) console.log("❌ Not signed in");
        if (!watchlistData) console.log("❌ No watchlist data");
      }
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length + 1) {
      // Navigate within watchlist
      const watchlist = this.tag("WatchlistPanel") as WatchlistPanel;
      if (watchlist && watchlist.handleDown()) {
        return true;
      }
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
      // Open full-screen search
      console.log("Opening full-screen search");
      this.fireAncestors("$openSearch");
      return true;
    } else if (this.currentFocusIndex === 1) {
      console.log("Opening Account/Auth screen");
      this.fireAncestors("$showAuthFlow");
      return true;
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length) {
      // Star button pressed - toggle watchlist
      console.log("Toggling watchlist for", this.currentSymbol);
      this._toggleWatchlist();
      return true;
    } else if (this.currentFocusIndex === 2 + TIME_PERIODS.length + 1) {
      // Watchlist item selected - load that stock
      const watchlist = this.tag("WatchlistPanel") as WatchlistPanel;
      if (watchlist) {
        const selectedStock = watchlist.getSelectedStock();
        if (selectedStock) {
          console.log(`Loading stock from watchlist: ${selectedStock}`);
          this.currentSymbol = selectedStock;

          // Update UI with symbol
          const mainDisplay = this.tag("MainDisplay");
          if (mainDisplay) {
            const symbolElement = mainDisplay.tag("StockSymbol");
            if (symbolElement && symbolElement.text) {
              symbolElement.text.text = selectedStock;
            }
          }

          // Update star button and load data
          this._updateWatchlistStarButton();
          void this._loadStockData(selectedStock);
          return true;
        }
      }
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

  /**
   * Public method to load a stock from search screen
   */
  loadStockFromSearch(symbol: string, name: string): void {
    console.log(`Loading stock from search: ${symbol} - ${name}`);
    this.currentSymbol = symbol;
    this.currentStockName = name;

    const mainDisplay = this.tag("MainDisplay");
    if (mainDisplay) {
      const symbolElement = mainDisplay.tag("StockSymbol");
      if (symbolElement && symbolElement.text) {
        symbolElement.text.text = symbol;
      }

      const nameElement = mainDisplay.tag("StockName");
      if (nameElement && nameElement.text) {
        nameElement.text.text = name;
      }
    }

    // Update star button to reflect new stock's watchlist status
    this._updateWatchlistStarButton();

    // Load stock data
    void this._loadStockData(symbol);
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
              background.setSmooth("color", 0x77ffffff, {
                duration: 0.3,
              });
              if (label && label.text) {
                label.text.textColor = Colors.white;
              }
            } else if (isSelected) {
              background.setSmooth("color", 0x55ffffff, {
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

    // Update watchlist focus
    const watchlist = this.tag("WatchlistPanel") as WatchlistPanel;
    const isWatchlistFocused =
      this.currentFocusIndex === 2 + TIME_PERIODS.length + 1;
    console.log(
      `🎯 Home._updateFocus: watchlist=${!!watchlist}, isWatchlistFocused=${isWatchlistFocused}, currentFocus=${
        this.currentFocusIndex
      }`
    );
    if (watchlist && watchlist.setFocused) {
      watchlist.setFocused(isWatchlistFocused);
    } else if (!watchlist) {
      console.log("❌ WatchlistPanel component not found!");
    }

    this.stage.update();
  }

  $searchActivated(event: ISearchActivatedEvent): void {
    this.isSearchActive = true;
    console.log("Search activated from SearchBar component");
  }

  $searchDeactivated(event: ISearchDeactivatedEvent): void {
    this.isSearchActive = false;
    this.searchResults = [];
    this._clearSearchResults();
    console.log("Search deactivated from SearchBar component");
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
    console.log("User authenticated, refreshing watchlist");
    this._updateWatchlistStarButton();
    this._updateWatchlist();
  }

  $signOut(): void {
    console.log("🚪 User signed out, clearing watchlist");
    this._updateWatchlistStarButton();
    this._updateWatchlist();
  }

  /**
   * Toggles current stock in/out of watchlist
   */
  private _toggleWatchlist(): void {
    WatchlistPanel.toggleWatchlist(this.currentSymbol);
    this._updateWatchlistStarButton();
    this._updateWatchlist();
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

    const isInWatchlist = WatchlistPanel.isInWatchlist(this.currentSymbol);

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
}
