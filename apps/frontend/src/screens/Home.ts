import { Lightning } from "@lightningjs/sdk";
import GalaxyBackground from "../components/backgrounds/GalaxyBackground";
import FlowingChart from "../components/charts/FlowingChart";
import WatchlistCard from "../components/cards/WatchlistCard";
import TimeSelector, { TimePeriod } from "../components/controls/TimeSelector";
import { fetchQuotes, fetchSeries } from "../services/api";

// Galaxy-themed stock dashboard

export default class Home extends Lightning.Component {
  private currentTimePeriod: TimePeriod = { id: "1W", label: "1W", days: 7 };
  private featuredStock = "NVDA";
  private watchlistSymbols = ["AAPL", "TSLA", "AMZN"];

  static _template() {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: 0xff000000, // Pure black base

      // Galaxy background with animated particles
      GalaxyBg: {
        type: GalaxyBackground,
      },

      // Flowing chart background (left side)
      FlowingChart: {
        type: FlowingChart,
        x: 0,
        y: 0,
      },

      // Main stock display (left side)
      StockDisplay: {
        x: 80,
        y: 120,
        StockSymbol: {
          text: {
            text: "NVDA",
            fontFace: "Arial",
            fontSize: 72,
            fontWeight: 700,
            textColor: 0xffffffff,
          },
        },
        StockPrice: {
          y: 100,
          text: {
            text: "302.14",
            fontFace: "Arial",
            fontSize: 96,
            fontWeight: 600,
            textColor: 0xff00d4ff,
          },
        },
        StockChange: {
          y: 220,
          text: {
            text: "+2.88%",
            fontFace: "Arial",
            fontSize: 32,
            fontWeight: 500,
            textColor: 0xff00d27a,
          },
        },
      },

      // Watchlist section (right side)
      WatchlistSection: {
        x: 1100,
        y: 150,
        w: 500,
        h: 400,
        WatchlistTitle: {
          x: 0,
          y: 0,
          text: {
            text: "WATCHLIST",
            fontFace: "Arial",
            fontSize: 24,
            fontWeight: 600,
            textColor: 0x99ffffff,
            letterSpacing: 3,
          },
        },
        WatchlistCards: {
          x: 0,
          y: 50,
          w: 500,
          h: 350,
          // Cards will be populated dynamically
        },
      },

      // Time selector (bottom)
      TimeSelector: {
        x: 80,
        y: 950,
        type: TimeSelector,
      },
    };
  }

  _init() {
    // Add some test text first to ensure rendering works
    this.patch({
      TestText: {
        x: 960,
        y: 540,
        mount: 0.5,
        text: {
          text: "🚀 Lightning Stocks Loading...",
          fontFace: "Arial",
          fontSize: 64,
          textColor: 0xffffffff,
        },
      },
    });
  }

  async _active() {
    try {
      console.log("🌌 Initializing Galaxy Stock Dashboard...");

      // Setup time selector callback
      const timeSelector = this.tag("TimeSelector") as any;
      if (timeSelector) {
        timeSelector.onChange = (period: TimePeriod) => {
          console.log("🕐 Time period changed to:", period);
          this.currentTimePeriod = period;
          this._loadDataForTimePeriod(period);
        };
      }

      // Remove test text
      this.patch({ TestText: undefined });

      // Load initial data
      await this._loadDataForTimePeriod(this.currentTimePeriod);
    } catch (error) {
      console.error("❌ Failed to load stock data:", error);
      this._showError("Failed to load stock data");
    }
  }

  private async _loadDataForTimePeriod(period: TimePeriod) {
    try {
      // Calculate data points based on time period
      const dataPoints = Math.min(period.days, 120); // Max 120 points for performance

      const allSymbols = [this.featuredStock, ...this.watchlistSymbols];
      const [quotes, series] = await Promise.all([
        fetchQuotes(allSymbols),
        fetchSeries(allSymbols, dataPoints),
      ]);

      // Remove test text
      this.patch({ TestText: undefined });

      // Update featured stock display
      await this._updateFeaturedStock(
        quotes[this.featuredStock],
        series[this.featuredStock]
      );

      // Update watchlist cards
      await this._updateWatchlistCards(quotes, series);

      console.log(`📊 Loaded ${period.label} data with ${dataPoints} points`);
    } catch (error) {
      console.error(`Failed to load ${period.label} data:`, error);
    }
  }

  private async _updateFeaturedStock(quote: any, seriesData: any) {
    if (!quote || !seriesData) return;

    const isPositive = quote.changePct >= 0;
    const changeText = `${isPositive ? "+" : ""}${(
      quote.changePct * 100
    ).toFixed(2)}%`;

    // Update stock display
    this.patch({
      StockDisplay: {
        StockSymbol: {
          text: { text: quote.symbol },
          alpha: 0,
        },
        StockPrice: {
          text: { text: quote.price.toFixed(2) },
          alpha: 0,
        },
        StockChange: {
          text: {
            text: changeText,
            textColor: isPositive ? 0xff00d27a : 0xffff4757,
          },
          alpha: 0,
        },
      },
    });

    // Animate text elements
    setTimeout(() => {
      this.tag("StockDisplay")
        ?.tag("StockSymbol")
        ?.setSmooth("alpha", 1, { duration: 0.8, delay: 0.1 });
      this.tag("StockDisplay")
        ?.tag("StockPrice")
        ?.setSmooth("alpha", 1, { duration: 0.8, delay: 0.3 });
      this.tag("StockDisplay")
        ?.tag("StockChange")
        ?.setSmooth("alpha", 1, { duration: 0.8, delay: 0.5 });
    }, 200);

    // Update flowing chart
    const chartComponent = this.tag("FlowingChart");
    if (chartComponent && seriesData.points) {
      const chartPoints = seriesData.points.map((p: any) => p.c);
      chartComponent.points = chartPoints;
    }
  }

  private async _updateWatchlistCards(quotes: any, series: any) {
    const watchlistCards = this.tag("WatchlistSection")?.tag("WatchlistCards");
    if (!watchlistCards) {
      console.warn("❌ WatchlistCards container not found");
      return;
    }

    console.log(
      "🎯 Creating watchlist cards for symbols:",
      this.watchlistSymbols
    );

    // Create watchlist cards
    const cards: any[] = [];
    this.watchlistSymbols.forEach((symbol, index) => {
      const quote = quotes[symbol];
      const seriesData = series[symbol];

      console.log(`📊 Card ${index}: ${symbol}`, {
        quote,
        seriesData: !!seriesData,
      });

      if (quote && seriesData) {
        const cardData = {
          ref: `Card_${symbol}`,
          type: WatchlistCard,
          x: 0,
          y: index * 100, // Spaced 100px apart
          alpha: 0,
          scale: 0.8,
        };

        cards.push(cardData);
      }
    });

    console.log("🎯 Setting cards as children:", cards.length);
    watchlistCards.children = cards;

    // Set stock data after cards are created and animate
    setTimeout(() => {
      this.watchlistSymbols.forEach((symbol, index) => {
        const quote = quotes[symbol];
        const seriesData = series[symbol];

        if (quote && seriesData) {
          const card = watchlistCards.tag(`Card_${symbol}`) as WatchlistCard;
          if (card) {
            console.log(`✅ Setting data for card: ${symbol}`);

            // Set stock data
            card.stockData = {
              symbol: quote.symbol,
              price: quote.price,
              changePct: quote.changePct,
              series: seriesData.points.map((p: any) => p.c),
            };

            // Animate card entrance
            setTimeout(() => {
              card.setSmooth("alpha", 1, { duration: 0.6 });
              card.setSmooth("scale", 1, { duration: 0.8 });
            }, index * 300);
          } else {
            console.warn(`❌ Card not found for symbol: ${symbol}`);
          }
        }
      });
    }, 500);
  }

  private _showError(message: string) {
    this.patch({
      ErrorMessage: {
        x: 960,
        y: 540,
        mount: 0.5,
        text: {
          text: `⚠️ ${message}`,
          fontFace: "Arial",
          fontSize: 32,
          textColor: 0xffff4757,
        },
      },
    });
  }

  _getFocused() {
    return this.tag("TimeSelector"); // Start with time selector focused
  }
}
