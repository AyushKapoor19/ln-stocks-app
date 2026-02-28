/**
 * Watchlist Panel Component
 *
 * Displays user's stock watchlist with real-time prices
 * Three states: Not signed in, Signed in (empty), Signed in (with stocks)
 */

import { Lightning } from "@lightningjs/sdk";
import { FontStyle, FontFamily } from "../constants/Fonts";
import { stocksApi } from "../services/stocksApi";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

interface TemplateSpec extends Lightning.Component.TemplateSpec {
  Border: object;
  Header: {
    Title: object;
  };
  Divider: object;
  EmptyStateNotSignedIn: {
    Icon: object;
    Message: object;
    Subtitle: object;
  };
  EmptyStateSignedIn: {
    Icon: object;
    Message: object;
    Subtitle: object;
  };
  StocksContainer: {
    StocksList: object;
  };
  ScrollIndicator: object;
  InteractiveBadge: object;
}

export default class WatchlistPanel
  extends Lightning.Component<TemplateSpec>
  implements Lightning.Component.ImplementTemplateSpec<TemplateSpec>
{
  private stocks: StockQuote[] = [];
  private selectedStockIndex = 0;
  private scrollY = 0;
  private readonly ITEM_HEIGHT = 55;
  private readonly CONTAINER_HEIGHT = 185;
  private isFocused = false;

  static override _template(): Lightning.Component.Template<TemplateSpec> {
    return {
      w: 520,
      h: 280,
      rect: true,
      color: 0xff0f0f0f,
      shader: {
        type: Lightning.shaders.RoundedRectangle,
        radius: 24,
      },
      Border: {
        w: 520,
        h: 280,
        rect: true,
        color: 0x00000000,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 24,
          stroke: 2,
          strokeColor: 0xff252525,
        },
      },
      Header: {
        x: 35,
        y: 30,
        Title: {
          x: 0,
          y: 0,
          text: {
            text: "Watchlist",
            fontFace: FontFamily.Default,
            fontSize: 28,
            fontStyle: FontStyle.Bold,
            textColor: 0xffffffff,
          },
        },
      },
      Divider: {
        x: 35,
        y: 75,
        w: 450,
        h: 1,
        rect: true,
        color: 0xff252525,
      },
      // Empty state for non-signed-in users
      EmptyStateNotSignedIn: {
        alpha: 0,
        Icon: {
          x: 260,
          y: 140,
          mount: 0.5,
          text: {
            text: "⭐",
            fontFace: FontFamily.Default,
            fontSize: 47,
            textColor: 0xff555555,
          },
        },
        Message: {
          x: 260,
          y: 195,
          mount: 0.5,
          text: {
            text: "Sign in to track your favorite stocks",
            fontFace: FontFamily.Default,
            fontSize: 19,
            fontStyle: FontStyle.SemiBold,
            textColor: 0xffdddddd,
            textAlign: "center",
            wordWrapWidth: 420,
          },
        },
        Subtitle: {
          x: 260,
          y: 230,
          mount: 0.5,
          text: {
            text: "Build a personalized watchlist",
            fontFace: FontFamily.Default,
            fontSize: 16,
            fontStyle: FontStyle.Regular,
            textColor: 0xff888888,
            textAlign: "center",
          },
        },
      },
      // Empty state for signed-in users with no watchlist
      EmptyStateSignedIn: {
        alpha: 0,
        Icon: {
          x: 260,
          y: 140,
          mount: 0.5,
          text: {
            text: "⭐",
            fontFace: FontFamily.Default,
            fontSize: 47,
            textColor: 0xff555555,
          },
        },
        Message: {
          x: 260,
          y: 195,
          mount: 0.5,
          text: {
            text: "Your watchlist is empty",
            fontFace: FontFamily.Default,
            fontSize: 19,
            fontStyle: FontStyle.SemiBold,
            textColor: 0xffdddddd,
            textAlign: "center",
          },
        },
        Subtitle: {
          x: 260,
          y: 230,
          mount: 0.5,
          text: {
            text: "Search and add stocks to track",
            fontFace: FontFamily.Default,
            fontSize: 16,
            fontStyle: FontStyle.Regular,
            textColor: 0xff888888,
            textAlign: "center",
          },
        },
      },
      // Scrollable watchlist container
      StocksContainer: {
        x: 35,
        y: 90,
        w: 450,
        h: 185,
        clipping: true,
        alpha: 0,
        StocksList: {
          y: 0,
        },
      },
      // Scroll indicator
      ScrollIndicator: {
        x: 490,
        y: 90,
        w: 3,
        h: 50,
        rect: true,
        color: 0xff888888,
        alpha: 0,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 2,
        },
      },
      // Interactive hint badge
      InteractiveBadge: {
        x: 340,
        y: 35,
        alpha: 0,
        text: {
          text: "Press ↓ to focus",
          fontFace: FontFamily.Default,
          fontSize: 20,
          fontStyle: FontStyle.SemiBold,
          textColor: 0xff999999,
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
    const stocksContainer = this.tag("StocksContainer");
    const scrollIndicator = this.tag("ScrollIndicator");
    const interactiveBadge = this.tag("InteractiveBadge");

    // Hide all states initially
    if (emptyStateNotSignedIn) emptyStateNotSignedIn.alpha = 0;
    if (emptyStateSignedIn) emptyStateSignedIn.alpha = 0;
    if (stocksContainer) stocksContainer.alpha = 0;
    if (scrollIndicator) scrollIndicator.alpha = 0;
    if (interactiveBadge) interactiveBadge.alpha = 0;

    // Determine which state to show
    if (!isLoggedIn) {
      // State 1: User not signed in

      if (emptyStateNotSignedIn) {
        emptyStateNotSignedIn.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }
    } else if (!hasWatchlistItems) {
      // State 2: User signed in but watchlist is empty

      if (emptyStateSignedIn) {
        emptyStateSignedIn.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }
    } else {
      // State 3: User signed in and has watchlist items

      const watchlist = this._getUserWatchlist();

      // Fetch real-time data for all watchlist stocks
      this._fetchAndBuildWatchlist(watchlist);
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
   * Fetches stock data and builds the scrollable list
   */
  private async _fetchAndBuildWatchlist(watchlist: string[]): Promise<void> {
    try {
      // Fetch quotes for all watchlist stocks in parallel
      const quotePromises = watchlist.map((symbol) =>
        stocksApi.getQuote(symbol),
      );
      const quotes = await Promise.all(quotePromises);

      // Build stocks array
      this.stocks = quotes
        .filter((quote) => quote !== null)
        .map((quote) => ({
          symbol: quote!.symbol,
          price: quote!.price,
          change: quote!.change,
          changePct: quote!.changePct,
        }));

      // Build the UI
      this._buildStocksList();

      // Show the container
      const stocksContainer = this.tag("StocksContainer");
      if (stocksContainer) {
        stocksContainer.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.8,
        });
      }

      // Show scroll indicator if there are more than 3 items
      const scrollIndicator = this.tag("ScrollIndicator");
      if (scrollIndicator && this.stocks.length > 3) {
        scrollIndicator.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 1.0,
        });
      }

      // Show interactive badge
      const interactiveBadge = this.tag("InteractiveBadge");
      if (interactiveBadge) {
        interactiveBadge.setSmooth("alpha", 1, {
          duration: 0.3,
          delay: 0.9,
        });
      }
    } catch (error) {
      console.error("Failed to show interactive badge animation:", error);
    }
  }

  /**
   * Builds the dynamic stock list with scrolling support
   */
  private _buildStocksList(): void {
    const stocksList = this.tag("StocksContainer")?.tag("StocksList");
    if (!stocksList) return;

    stocksList.childList.clear();

    this.stocks.forEach((stock, index) => {
      const isPositive = stock.change >= 0;
      const changePct = (stock.changePct * 100).toFixed(2);
      const sign = stock.change >= 0 ? "+" : "";

      const stockItem = {
        ref: `Stock_${index}`,
        y: index * this.ITEM_HEIGHT,
        w: 450,
        h: 50,
        rect: true,
        color: 0x00000000,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

        Symbol: {
          x: 15,
          y: 25,
          mount: 0,
          mountY: 0.5,
          text: {
            text: stock.symbol,
            fontFace: FontFamily.Default,
            fontSize: 22,
            fontStyle: FontStyle.Bold,
            textColor: 0xffffffff,
          },
        },

        Price: {
          x: 180,
          y: 25,
          mount: 0,
          mountY: 0.5,
          text: {
            text: stocksApi.formatPrice(stock.price),
            fontFace: FontFamily.Default,
            fontSize: 21,
            fontStyle: FontStyle.SemiBold,
            textColor: 0xffdddddd,
          },
        },

        Change: {
          x: 435,
          y: 25,
          mount: 1,
          mountY: 0.5,
          text: {
            text: `${sign}${changePct}%`,
            fontFace: FontFamily.Default,
            fontSize: 20,
            fontStyle: FontStyle.Bold,
            textColor: isPositive ? 0xff00ff88 : 0xffff4444,
          },
        },
      };

      stocksList.childList.a(stockItem);
    });

    this._updateStockFocus();
  }

  /**
   * Updates the visual focus state of stock items
   */
  private _updateStockFocus(): void {
    const stocksContainer = this.tag("StocksContainer");
    if (!stocksContainer) return;
    
    const stocksList = stocksContainer.tag("StocksList");
    if (!stocksList) {
      return;
    }

    this.stocks.forEach((_stock, index) => {
      const stockItem = (stocksList as unknown as Lightning.Component).tag(`Stock_${index}`);
      if (stockItem) {
        const isFocusedItem =
          this.isFocused && index === this.selectedStockIndex;

        stockItem.setSmooth("color", isFocusedItem ? 0x44ffffff : 0x00000000, {
          duration: 0.2,
        });
      }
    });
  }

  /**
   * Scrolls the list to keep the selected item visible
   */
  private _scrollToSelectedItem(): void {
    const stocksList = this.tag("StocksContainer")?.tag("StocksList");
    if (!stocksList) return;

    const targetY = this.selectedStockIndex * this.ITEM_HEIGHT;
    const maxScroll = Math.max(
      0,
      this.stocks.length * this.ITEM_HEIGHT - this.CONTAINER_HEIGHT,
    );

    // Calculate scroll position to keep item visible
    if (targetY < Math.abs(this.scrollY)) {
      // Item is above visible area
      this.scrollY = -targetY;
    } else if (
      targetY + this.ITEM_HEIGHT >
      Math.abs(this.scrollY) + this.CONTAINER_HEIGHT
    ) {
      // Item is below visible area
      this.scrollY = -(targetY + this.ITEM_HEIGHT - this.CONTAINER_HEIGHT);
    }

    // Clamp scroll position
    this.scrollY = Math.max(-maxScroll, Math.min(0, this.scrollY));

    stocksList.setSmooth("y", this.scrollY, { duration: 0.2 });

    // Update scroll indicator position
    const scrollIndicator = this.tag("ScrollIndicator");
    if (scrollIndicator && maxScroll > 0) {
      const scrollPercentage = Math.abs(this.scrollY) / maxScroll;
      const indicatorTravel = this.CONTAINER_HEIGHT - 60; // 60 is indicator height
      const indicatorY = 90 + scrollPercentage * indicatorTravel;
      scrollIndicator.setSmooth("y", indicatorY, { duration: 0.2 });
    }
  }

  /**
   * Public methods for focus handling
   */
  setFocused(focused: boolean): void {
    this.isFocused = focused;
    this._updateStockFocus();

    // Update border to show focus state
    const border = this.tag("Border");
    if (border && this.stocks.length > 0) {
      border.patch({
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: 24,
          stroke: 2,
          strokeColor: focused ? 0xff666666 : 0xff252525,
        },
      });
    }
  }

  handleUp(): boolean {
    if (!this.isFocused || this.stocks.length === 0) return false;

    if (this.selectedStockIndex > 0) {
      this.selectedStockIndex--;

      this._scrollToSelectedItem();
      this._updateStockFocus();
      return true;
    }
    return false;
  }

  handleDown(): boolean {
    if (!this.isFocused || this.stocks.length === 0) return false;

    if (this.selectedStockIndex < this.stocks.length - 1) {
      this.selectedStockIndex++;

      this._scrollToSelectedItem();
      this._updateStockFocus();
      return true;
    }
    return false;
  }

  getSelectedStock(): string | null {
    if (
      this.stocks.length === 0 ||
      this.selectedStockIndex >= this.stocks.length
    ) {
      return null;
    }
    return this.stocks[this.selectedStockIndex].symbol;
  }

  hasStocks(): boolean {
    return this.stocks.length > 0;
  }

  /**
   * Public method to save watchlist
   */
  static saveWatchlist(watchlist: string[]): void {
    try {
      localStorage.setItem("user_watchlist", JSON.stringify(watchlist));
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
      return;
    }

    try {
      const watchlistData = localStorage.getItem("user_watchlist");
      const watchlist = watchlistData ? JSON.parse(watchlistData) : [];

      if (watchlist.includes(symbol)) {
        return;
      }

      watchlist.push(symbol);
      WatchlistPanel.saveWatchlist(watchlist);
    } catch (error) {
      console.error(`Failed to add ${symbol} to watchlist:`, error);
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
        return;
      }

      watchlist.splice(index, 1);
      WatchlistPanel.saveWatchlist(watchlist);
    } catch (error) {
      console.error(`Failed to remove ${symbol} from watchlist:`, error);
    }
  }

  /**
   * Public method to toggle symbol in watchlist
   */
  static toggleWatchlist(symbol: string): void {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return;
    }

    if (WatchlistPanel.isInWatchlist(symbol)) {
      WatchlistPanel.removeFromWatchlist(symbol);
    } else {
      WatchlistPanel.addToWatchlist(symbol);
    }
  }
}
