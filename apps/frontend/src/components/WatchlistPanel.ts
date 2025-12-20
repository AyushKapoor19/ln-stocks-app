/**
 * Watchlist Panel Component
 *
 * Displays user's stock watchlist with real-time prices
 * Three states: Not signed in, Signed in (empty), Signed in (with stocks)
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import { stocksApi } from "../services/api";

interface TemplateSpec extends Lightning.Component.TemplateSpec {
  Title: object;
  EmptyStateNotSignedIn: object;
  EmptyStateSignedIn: object;
  Stock1: object;
  Stock2: object;
  Stock3: object;
}

export default class WatchlistPanel
  extends Lightning.Component<TemplateSpec>
  implements Lightning.Component.ImplementTemplateSpec<TemplateSpec>
{
  static override _template(): Lightning.Component.Template<TemplateSpec> {
    return {
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
      // Watchlist items
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
    };
  }

  /**
   * Updates the watchlist panel based on user authentication and watchlist state
   */
  update(): void {
    // Check authentication status
    const token = localStorage.getItem("auth_token");
    const isLoggedIn = !!token;

    // Check if user has watchlist items
    const hasWatchlistItems = this._hasWatchlistItems();

    // Get all UI elements
    const emptyStateNotSignedIn = this.tag("EmptyStateNotSignedIn");
    const emptyStateSignedIn = this.tag("EmptyStateSignedIn");
    const stock1 = this.tag("Stock1");
    const stock2 = this.tag("Stock2");
    const stock3 = this.tag("Stock3");

    // Hide all states initially
    if (emptyStateNotSignedIn) emptyStateNotSignedIn.alpha = 0;
    if (emptyStateSignedIn) emptyStateSignedIn.alpha = 0;
    if (stock1) stock1.alpha = 0;
    if (stock2) stock2.alpha = 0;
    if (stock3) stock3.alpha = 0;

    // Determine which state to show
    if (!isLoggedIn) {
      // State 1: User not signed in
      console.log("Watchlist: Showing sign-in prompt");
      if (emptyStateNotSignedIn) {
        emptyStateNotSignedIn.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }
    } else if (!hasWatchlistItems) {
      // State 2: User signed in but watchlist is empty
      console.log("Watchlist: Showing empty watchlist message");
      if (emptyStateSignedIn) {
        emptyStateSignedIn.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }
    } else {
      // State 3: User signed in and has watchlist items
      console.log("Watchlist: Showing user's stocks");
      const watchlist = this._getUserWatchlist();
      const stockElements = [stock1, stock2, stock3];

      // Fetch real-time data for watchlist stocks
      this._updateWatchlistPrices(watchlist.slice(0, 3), stockElements);
    }
  }

  /**
   * Retrieves user's watchlist from localStorage
   */
  private _getUserWatchlist(): string[] {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return [];

      const watchlistData = localStorage.getItem("user_watchlist");
      if (!watchlistData) return [];

      const watchlist = JSON.parse(watchlistData);
      return Array.isArray(watchlist) ? watchlist : [];
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      return [];
    }
  }

  /**
   * Checks if user has any items in their watchlist
   */
  private _hasWatchlistItems(): boolean {
    const watchlist = this._getUserWatchlist();
    return watchlist && watchlist.length > 0;
  }

  /**
   * Fetches and displays real-time prices for watchlist stocks
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
        if (!stockElement) return;

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
        if (!stockElement) return;

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

  /**
   * Public method to save watchlist
   */
  static saveWatchlist(watchlist: string[]): void {
    try {
      localStorage.setItem("user_watchlist", JSON.stringify(watchlist));
      console.log("Watchlist saved:", watchlist);
    } catch (error) {
      console.error("Failed to save watchlist:", error);
    }
  }

  /**
   * Public method to check if a symbol is in watchlist
   */
  static isInWatchlist(symbol: string): boolean {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const watchlistData = localStorage.getItem("user_watchlist");
      if (!watchlistData) return false;

      const watchlist = JSON.parse(watchlistData);
      return Array.isArray(watchlist) && watchlist.includes(symbol);
    } catch (error) {
      return false;
    }
  }

  /**
   * Public method to add symbol to watchlist
   */
  static addToWatchlist(symbol: string): void {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("User not signed in, cannot add to watchlist");
      return;
    }

    try {
      const watchlistData = localStorage.getItem("user_watchlist");
      const watchlist = watchlistData ? JSON.parse(watchlistData) : [];

      if (watchlist.includes(symbol)) {
        console.log(`${symbol} already in watchlist`);
        return;
      }

      watchlist.push(symbol);
      WatchlistPanel.saveWatchlist(watchlist);
      console.log(`Added ${symbol} to watchlist`);
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    }
  }

  /**
   * Public method to remove symbol from watchlist
   */
  static removeFromWatchlist(symbol: string): void {
    try {
      const watchlistData = localStorage.getItem("user_watchlist");
      if (!watchlistData) return;

      const watchlist = JSON.parse(watchlistData);
      const index = watchlist.indexOf(symbol);

      if (index === -1) {
        console.log(`${symbol} not in watchlist`);
        return;
      }

      watchlist.splice(index, 1);
      WatchlistPanel.saveWatchlist(watchlist);
      console.log(`Removed ${symbol} from watchlist`);
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  }

  /**
   * Public method to toggle symbol in watchlist
   */
  static toggleWatchlist(symbol: string): void {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("User not signed in");
      return;
    }

    if (WatchlistPanel.isInWatchlist(symbol)) {
      WatchlistPanel.removeFromWatchlist(symbol);
    } else {
      WatchlistPanel.addToWatchlist(symbol);
    }
  }
}

