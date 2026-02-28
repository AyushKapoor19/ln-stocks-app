import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import StockChart from "../components/charts/StockChart";
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
  private currentFocusIndex = 2;
  private focusableElements: string[] = [
    "SearchButton",
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
      SearchButton: {
        x: FRAME_LEFT + CONTENT_WIDTH - 150,
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
          w: 40,
          h: 40,
          src: "assets/icons/search-icon-white.png",
        },
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
          w: 40,
          h: 40,
          src: "assets/icons/user-icon-white.png",
        },
      },

      // Market Status Indicator - Circle Badge Next to Text
      MarketStatus: {
        x: FRAME_LEFT,
        y: FRAME_TOP,

        // Small Circle Badge
        StatusCircle: {
          x: 0,
          y: 6,
          w: 12,
          h: 12,
          rect: true,
          color: Colors.success,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 6 },
        },

        // Status Text
        StatusText: {
          x: 22,
          y: 1,
          text: {
            text: "Market Open",
            fontFace: FontFamily.Default,
            fontSize: 20,
            fontStyle: FontStyle.Bold,
            textColor: Colors.white,
          },
        },

        // Separator
        Separator: {
          x: 155,
          y: -6,
          w: 2,
          h: 32,
          rect: true,
          color: Colors.separator,
        },

        // Time Text
        TimeText: {
          x: 172,
          y: 1,
          text: {
            text: "9:30 AM - 4:00 PM EST",
            fontFace: FontFamily.Default,
            fontSize: 20,
            fontStyle: FontStyle.Regular,
            textColor: Colors.textQuaternary,
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
          {},
        ),
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

      // PANEL 1: Market Overview
      MarketIndicesPanel: {
        x: 1340,
        y: FRAME_TOP + 70,
        alpha: 0,
        w: 520,
        h: 290,
        rect: true,
        color: Colors.cardBackgroundDarker,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 24,
        },
        Border: {
          w: 520,
          h: 290,
          rect: true,
          color: Colors.transparent,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: 24,
            stroke: 2,
            strokeColor: Colors.strokeDark,
          },
        },
        Header: {
          x: 35,
          y: 30,
          Title: {
            x: 0,
            y: 0,
            text: {
              text: "Market Overview",
              fontFace: FontFamily.Default,
              fontSize: 28,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
            },
          },
        },
        Divider: {
          x: 35,
          y: 75,
          w: 450,
          h: 1,
          rect: true,
          color: Colors.strokeDark,
        },
        Content: {
          x: 35,
          y: 90,
          Index1: {
            y: 0,
            rect: true,
            w: 450,
            h: 50,
            color: Colors.transparent,
            Name: {
              x: 5,
              y: 16,
              text: {
                text: "S&P 500",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textLight,
              },
            },
            Price: {
              x: 200,
              y: 16,
              text: {
                text: "...",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.white,
              },
            },
            Change: {
              x: 350,
              y: 16,
              mount: 0,
              text: {
                text: "--",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.stockGreenBright,
              },
            },
          },
          Separator1: {
            y: 55,
            w: 450,
            h: 1,
            rect: true,
            color: Colors.separator,
          },
          Index2: {
            y: 63,
            rect: true,
            w: 450,
            h: 50,
            color: Colors.transparent,
            Name: {
              x: 5,
              y: 16,
              text: {
                text: "Dow Jones",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textLight,
              },
            },
            Price: {
              x: 200,
              y: 16,
              text: {
                text: "...",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.white,
              },
            },
            Change: {
              x: 350,
              y: 16,
              mount: 0,
              text: {
                text: "--",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.stockGreenBright,
              },
            },
          },
          Separator2: {
            y: 118,
            w: 450,
            h: 1,
            rect: true,
            color: Colors.separator,
          },
          Index3: {
            y: 126,
            rect: true,
            w: 450,
            h: 50,
            color: Colors.transparent,
            Name: {
              x: 5,
              y: 16,
              text: {
                text: "Nasdaq",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.textLight,
              },
            },
            Price: {
              x: 200,
              y: 16,
              text: {
                text: "...",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.white,
              },
            },
            Change: {
              x: 350,
              y: 16,
              mount: 0,
              text: {
                text: "--",
                fontFace: FontFamily.Default,
                fontSize: 24,
                fontStyle: FontStyle.Bold,
                textColor: Colors.stockGreenBright,
              },
            },
          },
        },
      },

      // PANEL 2: Stock Details
      StatsPanel: {
        x: 1340,
        y: FRAME_TOP + 380,
        alpha: 0,
        w: 520,
        h: 290,
        rect: true,
        color: Colors.cardBackgroundDarker,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 24,
        },
        Border: {
          w: 520,
          h: 290,
          rect: true,
          color: Colors.transparent,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: 24,
            stroke: 2,
            strokeColor: Colors.strokeDark,
          },
        },
        Header: {
          x: 35,
          y: 30,
          Title: {
            x: 0,
            y: 0,
            text: {
              text: "Stock Details",
              fontFace: FontFamily.Default,
              fontSize: 28,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
            },
          },
        },
        Divider: {
          x: 35,
          y: 75,
          w: 450,
          h: 1,
          rect: true,
          color: Colors.strokeDark,
        },
        Content: {
          x: 35,
          y: 95,
          Row1: {
            y: 0,
            Stat1: {
              x: 0,
              Label: {
                x: 0,
                y: 0,
                text: {
                  text: "Volume",
                  fontFace: FontFamily.Default,
                  fontSize: 16,
                  fontStyle: FontStyle.Regular,
                  textColor: Colors.textQuaternary,
                },
              },
              Value: {
                x: 0,
                y: 28,
                text: {
                  text: "...",
                  fontFace: FontFamily.Default,
                  fontSize: 26,
                  fontStyle: FontStyle.Bold,
                  textColor: Colors.white,
                },
              },
            },
            Stat2: {
              x: 225,
              Label: {
                x: 0,
                y: 0,
                text: {
                  text: "Market Cap",
                  fontFace: FontFamily.Default,
                  fontSize: 16,
                  fontStyle: FontStyle.Regular,
                  textColor: Colors.textQuaternary,
                },
              },
              Value: {
                x: 0,
                y: 28,
                text: {
                  text: "...",
                  fontFace: FontFamily.Default,
                  fontSize: 26,
                  fontStyle: FontStyle.Bold,
                  textColor: Colors.white,
                },
              },
            },
          },
          Divider1: {
            y: 75,
            w: 450,
            h: 1,
            rect: true,
            color: Colors.separatorLight,
          },
          Row2: {
            y: 95,
            Stat3: {
              x: 0,
              Label: {
                x: 0,
                y: 0,
                text: {
                  text: "Day Range",
                  fontFace: FontFamily.Default,
                  fontSize: 16,
                  fontStyle: FontStyle.Regular,
                  textColor: Colors.textQuaternary,
                },
              },
              Value: {
                x: 0,
                y: 28,
                text: {
                  text: "...",
                  fontFace: FontFamily.Default,
                  fontSize: 22,
                  fontStyle: FontStyle.Bold,
                  textColor: Colors.white,
                },
              },
            },
            Stat4: {
              x: 225,
              Label: {
                x: 0,
                y: 0,
                text: {
                  text: "52 Week Range",
                  fontFace: FontFamily.Default,
                  fontSize: 16,
                  fontStyle: FontStyle.Regular,
                  textColor: Colors.textQuaternary,
                },
              },
              Value: {
                x: 0,
                y: 28,
                text: {
                  text: "...",
                  fontFace: FontFamily.Default,
                  fontSize: 22,
                  fontStyle: FontStyle.Bold,
                  textColor: Colors.white,
                },
              },
            },
          },
        },
      },

      // PANEL 3: Watchlist
      WatchlistPanel: {
        type: WatchlistPanel,
        x: 1340,
        y: FRAME_TOP + 690,
        alpha: 0,
      },
    };
  }

  _init(): void {
    super._init();

    this._updateMarketStatus();
    this._updateMarketIndices();
    this._updateWatchlistStarButton();
    this._updateWatchlist();
    this._loadStockData(this.currentSymbol);
    this._restoreButtonStates();
    this.currentFocusIndex = 2;
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
      this._updateMarketStatus();
      this._updateMarketIndices();
      this._updateWatchlist();
      this._loadStockData(this.currentSymbol);
      this._restoreButtonStates();
      this._updateFocus();
    } catch (error) {}
  }

  private _restoreButtonStates(): void {
    this._updateFocus();
  }

  private async _loadStockData(symbol: string): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      const [quote, series] = await Promise.all([
        stocksApi.getQuote(symbol),
        stocksApi.getSeries(symbol, this.currentTimePeriod.id),
      ]);

      if (quote) {
        this.currentPrice = quote.price;
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

        const chartData = stocksApi.formatSeriesForChart(series);
        if (chartData.length > 0) {
          this._updateChartWithTimestamps(series);
        } else {
        }
      } else {
        if (quote) {
          this.currentChange = quote.change;
          this.currentChangePct = quote.changePct;
          this._updatePriceDisplay();
        }
      }
    } catch (error) {
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
          this.currentChangePct,
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
    if (!marketStatus) return;

    const statusCircle = marketStatus.tag("StatusCircle");
    const statusText = marketStatus.tag("StatusText");
    const separator = marketStatus.tag("Separator");
    const timeText = marketStatus.tag("TimeText");

    // Define colors based on market status
    const circleColor = status.isOpen ? Colors.success : Colors.error;

    // Update circle color
    if (statusCircle) {
      statusCircle.color = circleColor;
    }

    // Update status text
    if (statusText && statusText.text) {
      statusText.text.text = status.statusText;
    }

    // Update separator and time text positions based on text width
    if (separator) {
      separator.x = layout.separatorX;
    }

    if (timeText) {
      timeText.x = layout.timeTextX;
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
      const content = panel.tag("Content");
      if (!content) return;

      this.marketIndices.forEach((index, i) => {
        const indexElement = content.tag(`Index${i + 1}`);
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
            2,
          )}%`;
          changeElement.text.textColor = changeColor;
        }
      });
    } catch (error) {
      // Fall back to displaying existing hardcoded data if API fails
      const content = panel.tag("Content");
      if (!content) return;

      this.marketIndices.forEach((index, i) => {
        const indexElement = content.tag(`Index${i + 1}`);
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
            2,
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
    statsPanel.setSmooth("y", FRAME_TOP + 380, { duration: 0.6, delay: 0.4 });

    try {
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
          quote.dayLow,
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
          metrics.week52Low,
        )} - ${stocksApi.formatPrice(metrics.week52High)}`;
      }

      // Update UI - new path structure
      const content = statsPanel.tag("Content");
      if (!content) return;

      const row1 = content.tag("Row1");
      const row2 = content.tag("Row2");

      if (row1) {
        const stat1Value = row1.tag("Stat1") && row1.tag("Stat1").tag("Value");
        if (stat1Value && stat1Value.text) {
          stat1Value.text.text = volume;
        }

        const stat2Value = row1.tag("Stat2") && row1.tag("Stat2").tag("Value");
        if (stat2Value && stat2Value.text) {
          stat2Value.text.text = marketCap;
        }
      }

      if (row2) {
        const stat3Value = row2.tag("Stat3") && row2.tag("Stat3").tag("Value");
        if (stat3Value && stat3Value.text) {
          stat3Value.text.text = dayRange;
        }

        const stat4Value = row2.tag("Stat4") && row2.tag("Stat4").tag("Value");
        if (stat4Value && stat4Value.text) {
          stat4Value.text.text = week52Range;
        }
      }
    } catch (error) {
      // Fall back to N/A values
      const content = statsPanel.tag("Content");
      if (!content) return;

      const row1 = content.tag("Row1");
      const row2 = content.tag("Row2");

      if (row1) {
        const stat1Value = row1.tag("Stat1") && row1.tag("Stat1").tag("Value");
        if (stat1Value && stat1Value.text) stat1Value.text.text = "N/A";

        const stat2Value = row1.tag("Stat2") && row1.tag("Stat2").tag("Value");
        if (stat2Value && stat2Value.text) stat2Value.text.text = "N/A";
      }

      if (row2) {
        const stat3Value = row2.tag("Stat3") && row2.tag("Stat3").tag("Value");
        if (stat3Value && stat3Value.text) stat3Value.text.text = "N/A";

        const stat4Value = row2.tag("Stat4") && row2.tag("Stat4").tag("Value");
        if (stat4Value && stat4Value.text) stat4Value.text.text = "N/A";
      }
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
    watchlistPanel.setSmooth("y", FRAME_TOP + 690, {
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
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    // From watchlist, navigate within it first
    if (this.currentFocusIndex === 6) {
      const watchlist = this.tag("WatchlistPanel") as WatchlistPanel;
      if (watchlist && watchlist.handleUp()) {
        return true;
      }
      // If at top of watchlist, exit to 1M button

      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 5 && isLoggedIn) {
      // From Star button, go to Search
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 4 && !isLoggedIn) {
      // From 1Y button (when not logged in, no star), go to Search
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    // From any button (Search, Sign In, 1M, 3M, 1Y, Star), go to watchlist
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex <= 5) {
      const token = localStorage.getItem("auth_token");
      const watchlistData = localStorage.getItem("user_watchlist");

      if (token && watchlistData) {
        try {
          const watchlist = JSON.parse(watchlistData);
          if (Array.isArray(watchlist) && watchlist.length > 0) {
            this.currentFocusIndex = 6; // Watchlist index
            this._updateFocus();
            return true;
          } else {
          }
        } catch (error) {}
      } else {
        if (!token) {
        }
        if (!watchlistData) {
        }
      }
    } else if (this.currentFocusIndex === 6) {
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

    // Workflow (reverse): 1M ← 3M ← 1Y ← Star ← Search ← SignIn (no loop, 1M is the end)
    if (this.currentFocusIndex === 3) {
      // From 3M, go to 1M
      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 4) {
      // From 1Y, go to 3M
      this.currentFocusIndex = 3;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 5 && isLoggedIn) {
      // From Star, go to 1Y
      this.currentFocusIndex = 4;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 0) {
      // From Search, go to Star if logged in, else go to 1Y
      if (isLoggedIn) {
        this.currentFocusIndex = 5;
      } else {
        this.currentFocusIndex = 4;
      }
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 1) {
      // From Sign In, go to Search
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    }
    // At 1M (index 2), can't go further left
    return false;
  }

  _handleRight(): boolean {
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    // Workflow: 1M → 3M → 1Y → Star → Search → SignIn (no loop, Sign In is the end)
    if (this.currentFocusIndex === 2) {
      // From 1M, go to 3M
      this.currentFocusIndex = 3;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 3) {
      // From 3M, go to 1Y
      this.currentFocusIndex = 4;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 4) {
      // From 1Y, go to Star if logged in, else go to Search
      if (isLoggedIn) {
        this.currentFocusIndex = 5;
      } else {
        this.currentFocusIndex = 0;
      }
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 5 && isLoggedIn) {
      // From Star, go to Search
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 0) {
      // From Search, go to Sign In
      this.currentFocusIndex = 1;
      this._updateFocus();
      return true;
    }
    // At Sign In (index 1), can't go further right
    return false;
  }

  _handleEnter(): boolean {
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    if (this.currentFocusIndex === 0) {
      // Open full-screen search

      this.fireAncestors("$openSearch");
      return true;
    } else if (this.currentFocusIndex === 1) {
      this.fireAncestors("$showAuthFlow");
      return true;
    } else if (this.currentFocusIndex === 5 && isLoggedIn) {
      // Star button pressed - toggle watchlist (only if logged in)

      this._toggleWatchlist();
      return true;
    } else if (this.currentFocusIndex === 6) {
      // Watchlist item selected - load that stock
      const watchlist = this.tag("WatchlistPanel") as WatchlistPanel;
      if (watchlist) {
        const selectedStock = watchlist.getSelectedStock();
        if (selectedStock) {
          this.currentSymbol = selectedStock;

          // Update UI with symbol
          const mainDisplay = this.tag("MainDisplay");
          if (mainDisplay) {
            const symbolElement = mainDisplay.tag("StockSymbol");
            if (symbolElement && symbolElement.text) {
              symbolElement.text.text = selectedStock;
            }
          }

          // Exit watchlist and switch focus to 1M button
          this.currentFocusIndex = 2;
          this._updateFocus();

          // Update star button and load data
          this._updateWatchlistStarButton();
          void this._loadStockData(selectedStock);
          return true;
        }
      }
    } else if (this.currentFocusIndex >= 2 && this.currentFocusIndex <= 4) {
      // Time period buttons (1M=2, 3M=3, 1Y=4)
      const buttonIndex = this.currentFocusIndex - 2;
      this._selectTimePeriod(buttonIndex);
      return true;
    }
    return false;
  }

  _handleBack(): boolean {
    // Back button only works from watchlist to exit to 1M button
    if (this.currentFocusIndex === 6) {
      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    }
    // For all other buttons (1M, 3M, 1Y, Star, Search, Sign In), consume the event but do nothing
    // This prevents the back button from navigating away from the home screen
    return true;
  }

  updateAuthButton(isLoggedIn: boolean): void {
    const signInButton = this.tag("SignInButton");
    if (!signInButton) return;

    const icon = signInButton.tag("Icon");
    if (icon) {
      // Always show user icon, regardless of login status
      icon.patch({
        src: "assets/icons/user-icon-white.png",
        w: 40,
        h: 40,
      });
    }

    this.stage.update();
  }

  _handleKey(event: KeyboardEvent): boolean {
    // No special key handling needed for simple buttons
    return false;
  }

  private _selectTimePeriod(newIndex: number): void {
    const newPeriod = TIME_PERIODS[newIndex];

    this.selectedPeriodIndex = newIndex;
    this.currentTimePeriod = newPeriod;

    this._updateFocus();

    this._loadStockData(this.currentSymbol);
  }

  private _showSearchResults(): void {}

  private _updateSearchSelection(): void {}

  private _clearSearchResults(): void {
    this.searchResults = [];
  }

  private async _selectStock(symbol: string, name: string): Promise<void> {
    this.currentSymbol = symbol;
    this.currentStockName = name;

    const mainDisplay = this.tag("MainDisplay");
    if (mainDisplay) {
      const titleElement = mainDisplay.tag("StockSymbol");
      if (titleElement) {
        titleElement.text.text = `${symbol} - ${name}`;
      }
    }

    this.currentFocusIndex = 2;
    this._updateFocus();

    // Update star button to reflect new stock's watchlist status
    this._updateWatchlistStarButton();

    await this._loadStockData(symbol);
  }

  /**
   * Public method to load a stock from search screen
   */
  loadStockFromSearch(symbol: string, name: string): void {
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
    return this as Lightning.Component;
  }

  private _updateFocus(): void {
    // Update search button focus
    const searchButton = this.tag("SearchButton");
    if (searchButton) {
      const background = searchButton.tag("Background");
      if (background) {
        if (this.currentFocusIndex === 0) {
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

    // Update sign in button focus
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
              background.setSmooth("color", Colors.focusBackground, {
                duration: 0.3,
              });
              if (label && label.text) {
                label.text.textColor = Colors.white;
              }
            } else if (isSelected) {
              background.setSmooth("color", Colors.selectionBackground, {
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

    // Update star button focus (only if logged in)
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    const starButton = this.tag("WatchlistStarButton");
    if (starButton && isLoggedIn) {
      const background = starButton.tag("Background");
      const starIcon = starButton.tag("StarIcon");
      const isFocused = this.currentFocusIndex === 5;

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
    const isWatchlistFocused = this.currentFocusIndex === 6;

    if (watchlist && watchlist.setFocused) {
      watchlist.setFocused(isWatchlistFocused);
    } else if (!watchlist) {
    }

    this.stage.update();
  }

  $searchActivated(event: ISearchActivatedEvent): void {
    this.isSearchActive = true;
  }

  $searchDeactivated(event: ISearchDeactivatedEvent): void {
    this.isSearchActive = false;
    this.searchResults = [];
    this._clearSearchResults();
  }

  $showSearchResults(event: IShowSearchResultsEvent): void {}

  $updateSearchSelection(event: IUpdateSearchSelectionEvent): void {}

  $navigateSearchResultsUp(event: INavigateSearchResultsEvent): void {}

  $navigateSearchResultsDown(event: INavigateSearchResultsEvent): void {}

  $clearSearchResults(): void {
    this._clearSearchResults();
  }

  $selectStock(event: ISelectStockEvent): void {
    if (event && event.symbol && event.name) {
      this._selectStock(event.symbol, event.name);
    }
  }

  $authenticationSuccess(): void {
    this._updateWatchlistStarButton();
    this._updateWatchlist();
  }

  $signOut(): void {
    // If currently focused on star button or watchlist, move focus to 1M button
    if (this.currentFocusIndex === 5 || this.currentFocusIndex === 6) {
      this.currentFocusIndex = 2; // Move to 1M button
    }

    this._updateWatchlistStarButton();
    this._updateWatchlist();
    this._updateFocus();
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
      starIcon.text.textColor = Colors.starGold;
    } else {
      // Empty star with border
      starIcon.text.text = "☆";
      starIcon.text.textColor = Colors.textTertiary;
    }
  }
}
