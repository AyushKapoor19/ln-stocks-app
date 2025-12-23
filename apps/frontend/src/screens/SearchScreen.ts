/**
 * Full-Screen Search Experience
 * Layout: 1/3 keyboard panel + 2/3 results carousel
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import { stocksApi, type SearchResult } from "../services/api";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";

interface StockCardData extends SearchResult {
  price?: number;
  change?: number;
  changePct?: number;
  description?: string;
}

export default class SearchScreen extends BaseScreen {
  private searchQuery = "";
  private searchResults: StockCardData[] = [];
  private selectedKeyRow = 0;
  private selectedKeyCol = 0;
  private selectedCardIndex = -1;
  private currentFocus: "keyboard" | "cards" = "keyboard";
  private searchTimeout: NodeJS.Timeout | undefined = undefined;
  private cursorBlinkInterval: NodeJS.Timeout | undefined = undefined;
  private cursorVisible = true;

  // Compact 6-column keyboard layout
  private keyboard = [
    ["1", "2", "3", "4", "5", "6"],
    ["7", "8", "9", "0", ".", "-"],
    ["a", "b", "c", "d", "e", "f"],
    ["g", "h", "i", "j", "k", "l"],
    ["m", "n", "o", "p", "q", "r"],
    ["s", "t", "u", "v", "w", "x"],
    ["y", "z", "SPACE", "SPACE", "⌫", "CLR"],
  ];

  static override _template(): Lightning.Component.Template {
    const LEFT_PANEL_WIDTH = 640; // 1/3 of 1920
    const RIGHT_PANEL_WIDTH = 1280; // 2/3 of 1920
    const RIGHT_PANEL_X = LEFT_PANEL_WIDTH;

    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: 0xff000000,

      // Left Panel - Compact Keyboard (1/3 screen)
      LeftPanel: {
        x: 0,
        y: 0,
        w: LEFT_PANEL_WIDTH,
        h: 1080,
        rect: true,
        color: 0xff0a0a0a,

        Title: {
          x: 40,
          y: 50,
          text: {
            text: "Search Stocks",
            fontSize: 48,
            fontStyle: FontStyle.Bold,
            textColor: Colors.white,
            fontFace: FontFamily.Default,
          },
        },

        // Query Display - Large and prominent
        QueryContainer: {
          x: 40,
          y: 120,
          w: LEFT_PANEL_WIDTH - 80,
          h: 60,

          QueryText: {
            x: 0,
            y: 0,
            text: {
              text: "Type to search...",
              fontSize: 36,
              fontStyle: FontStyle.Bold,
              textColor: 0xff666666,
              fontFace: FontFamily.Default,
            },
          },

          Cursor: {
            x: 0,
            y: 0,
            text: {
              text: "|",
              fontSize: 36,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
              fontFace: FontFamily.Default,
            },
          },
        },

        // Compact 6-column Keyboard
        Keyboard: {
          x: 40,
          y: 210,
          w: LEFT_PANEL_WIDTH - 80,
          h: 420,
        },

        // Instructions
        Instructions: {
          x: 40,
          y: 1000,
          text: {
            text: "Press BACK to close",
            fontSize: 16,
            textColor: 0xff666666,
            fontFace: FontFamily.Default,
          },
        },
      },

      // Right Panel - Stock Cards Carousel (2/3 screen)
      RightPanel: {
        x: RIGHT_PANEL_X,
        y: 0,
        w: RIGHT_PANEL_WIDTH,
        h: 1080,

        TopResultsTitle: {
          x: 40,
          y: 50,
          text: {
            text: "Top Results",
            fontSize: 48,
            fontStyle: FontStyle.Bold,
            textColor: Colors.white,
            fontFace: FontFamily.Default,
          },
        },

        CardsGrid: {
          x: 40,
          y: 130,
          w: RIGHT_PANEL_WIDTH - 80,
          h: 920,
        },
      },
    };
  }

  override _init(): void {
    super._init();
    console.log("✅ SearchScreen initialized");
    this._buildKeyboard();
    this._startCursorBlink();
    this._loadPopularStocks();
  }

  override _detach(): void {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    super._detach();
  }

  private _buildKeyboard(): void {
    const keyboard = this.tag("Keyboard");
    if (!keyboard) return;

    const KEY_SIZE = 82; // Larger for 6-column layout
    const KEY_SPACING = 8;
    const ROW_SPACING = 10;

    this.keyboard.forEach((row, rowIndex) => {
      row.forEach((key, colIndex) => {
        // Special handling for space (takes 2 columns) and special keys
        const isSpace = key === "SPACE";
        const isBackspace = key === "⌫";
        const isClear = key === "CLR";
        const isSpecial = isBackspace || isClear;

        // Skip second SPACE placeholder
        if (isSpace && colIndex === 3) return;

        const keyWidth = isSpace ? KEY_SIZE * 2 + KEY_SPACING : KEY_SIZE;
        const xPosition = colIndex * (KEY_SIZE + KEY_SPACING);

        const keyComponent = {
          ref: `Key_${rowIndex}_${colIndex}`,
          x: xPosition,
          y: rowIndex * (KEY_SIZE + ROW_SPACING),
          w: keyWidth,
          h: KEY_SIZE,
          rect: true,
          color: 0xff2a2a2a,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },
          Label: {
            x: keyWidth / 2,
            y: KEY_SIZE / 2,
            mount: 0.5,
            text: {
              text: isSpace ? "space" : key,
              fontSize: isSpecial ? 20 : isSpace ? 22 : 28,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
              fontFace: FontFamily.Default,
            },
          },
        };

        keyboard.childList.a(keyComponent);
      });
    });

    this._updateKeyboardFocus();
  }

  private _startCursorBlink(): void {
    this.cursorBlinkInterval = setInterval(() => {
      // Only blink cursor when there's text
      if (this.searchQuery.length > 0) {
        this.cursorVisible = !this.cursorVisible;
        const cursor = this.tag("Cursor");
        if (cursor) {
          cursor.setSmooth("alpha", this.cursorVisible ? 1 : 0, {
            duration: 0.1,
          });
        }
      }
    }, 500);
  }

  private async _loadPopularStocks(): Promise<void> {
    try {
      console.log("✅ Loading popular stocks...");
      const popularSymbols = [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "TSLA",
        "NVDA",
        "META",
        "NFLX",
        "DIS",
        "PYPL",
        "INTC",
        "AMD",
        "ORCL",
        "CSCO",
        "ADBE",
        "CRM",
        "AVGO",
        "TXN",
      ];

      const popularStocks: SearchResult[] = popularSymbols.map((symbol) => ({
        symbol,
        name: this._getStockName(symbol),
      }));

      console.log(
        `✅ Loading details for ${popularStocks.length} popular stocks`
      );
      await this._loadStockDetails(popularStocks);
    } catch (error) {
      console.error("❌ Failed to load popular stocks:", error);
    }
  }

  private _getStockName(symbol: string): string {
    const names: Record<string, string> = {
      AAPL: "Apple Inc.",
      MSFT: "Microsoft Corporation",
      GOOGL: "Alphabet Inc.",
      AMZN: "Amazon.com Inc.",
      TSLA: "Tesla Inc.",
      NVDA: "NVIDIA Corporation",
      META: "Meta Platforms Inc.",
      NFLX: "Netflix Inc.",
      DIS: "The Walt Disney Company",
      PYPL: "PayPal Holdings Inc.",
      INTC: "Intel Corporation",
      AMD: "Advanced Micro Devices Inc.",
      ORCL: "Oracle Corporation",
      CSCO: "Cisco Systems Inc.",
      ADBE: "Adobe Inc.",
      CRM: "Salesforce Inc.",
      AVGO: "Broadcom Inc.",
      TXN: "Texas Instruments Inc.",
    };
    return names[symbol] || symbol;
  }

  private async _loadStockDetails(results: SearchResult[]): Promise<void> {
    console.log(`✅ Fetching details for ${results.length} stocks`);

    // Show cards immediately with "Loading..." state
    this.searchResults = results.slice(0, 18).map((result) => ({
      ...result,
      price: undefined,
      change: undefined,
      changePct: undefined,
    }));
    this._buildStockCards();

    // Load all prices in parallel for speed
    const pricePromises = this.searchResults.map(async (result, index) => {
      try {
        const quote = await stocksApi.getQuote(result.symbol);

        // Update this specific stock's data
        this.searchResults[index] = {
          ...result,
          price: quote?.price,
          change: quote?.change,
          changePct: quote?.changePct,
        };

        // Update just this card
        this._updateSingleCard(index);
        console.log(`✅ Loaded ${result.symbol}: $${quote?.price}`);
      } catch (error) {
        console.error(`❌ Failed to load ${result.symbol}:`, error);
      }
    });

    // Wait for all prices to load
    await Promise.all(pricePromises);
    console.log(`✅ All stock prices loaded`);
  }

  private _updateSingleCard(index: number): void {
    const grid = this.tag("CardsGrid");
    if (!grid) return;

    const card = grid.tag(`Card_${index}`);
    if (!card) return;

    const stock = this.searchResults[index];
    if (!stock) return;

    const content = card.tag("Content");
    if (!content) return;

    const isPositive = stock.change && stock.change >= 0;

    // Update price
    const priceTag = content.tag("Price");
    if (priceTag && priceTag.text) {
      priceTag.text.text = stock.price
        ? `$${stock.price.toFixed(2)}`
        : "Loading...";
    }

    // Update change
    const changeTag = content.tag("Change");
    if (changeTag && changeTag.text) {
      changeTag.text.text =
        stock.change && stock.changePct
          ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(
              2
            )} (${stock.changePct.toFixed(2)}%)`
          : "";
      changeTag.text.textColor = isPositive ? 0xff22c55e : 0xffef4444;
    }

    // Update gradient overlay
    const gradient = card.tag("GradientOverlay");
    if (gradient) {
      gradient.patch({
        colorTop: isPositive ? 0x2016a34a : 0x20dc2626,
      });
    }

    // Update border color
    const border = card.tag("Border");
    if (border) {
      const borderColor = isPositive ? Colors.success : Colors.error;
      border.patch({
        color: borderColor,
      });
    }
  }

  private _buildStockCards(): void {
    const grid = this.tag("CardsGrid");
    if (!grid) {
      console.error("❌ CardsGrid not found");
      return;
    }

    // Quick fade-out and immediate render for speed
    const existingCards = grid.children || [];
    if (existingCards.length > 0) {
      existingCards.forEach((card: any) => {
        if (card && card.setSmooth) {
          card.setSmooth("alpha", 0, { duration: 0.1 });
        }
      });

      // Minimal delay for smooth transition
      setTimeout(() => {
        this._renderStockCards();
      }, 50);
    } else {
      // No existing cards, render immediately
      this._renderStockCards();
    }
  }

  private _renderStockCards(): void {
    const grid = this.tag("CardsGrid");
    if (!grid) return;

    grid.childList.clear();

    // Larger cards for 2/3 screen (3 columns)
    const CARD_WIDTH = 380;
    const CARD_HEIGHT = 220;
    const CARD_SPACING = 20;
    const COLS = 3;

    console.log(`✅ Building ${this.searchResults.length} stock cards`);

    this.searchResults.forEach((stock, index) => {
      const row = Math.floor(index / COLS);
      const col = index % COLS;

      const isPositive = stock.change && stock.change >= 0;
      const borderColor = isPositive ? Colors.success : Colors.error;

      const card = {
        ref: `Card_${index}`,
        x: col * (CARD_WIDTH + CARD_SPACING),
        y: row * (CARD_HEIGHT + CARD_SPACING),
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
        rect: true,
        color: 0xff1a1a1a,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },
        alpha: 0, // Start invisible for fade-in

        // Gradient Overlay
        GradientOverlay: {
          x: 0,
          y: 0,
          w: CARD_WIDTH,
          h: CARD_HEIGHT,
          rect: true,
          colorTop: isPositive ? 0x2016a34a : 0x20dc2626,
          colorBottom: 0x00000000,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },
        },

        // Focus Border - Dynamic color based on stock performance
        Border: {
          x: -6,
          y: -6,
          w: CARD_WIDTH + 12,
          h: CARD_HEIGHT + 12,
          rect: true,
          color: borderColor,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },
          alpha: 0,
        },

        Content: {
          x: 28,
          y: 28,
          w: CARD_WIDTH - 56,
          h: CARD_HEIGHT - 56,

          // Symbol - Large and bold
          Symbol: {
            x: 0,
            y: 0,
            text: {
              text: stock.symbol,
              fontSize: 48,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
              fontFace: FontFamily.Default,
            },
          },

          // Company Name - Smaller, grey
          Name: {
            x: 0,
            y: 60,
            text: {
              text:
                stock.name.length > 28
                  ? stock.name.substring(0, 28) + "..."
                  : stock.name,
              fontSize: 18,
              textColor: 0xffaaaaaa,
              fontFace: FontFamily.Default,
              wordWrap: true,
              wordWrapWidth: CARD_WIDTH - 56,
              maxLines: 2,
            },
          },

          // Price - Large, prominent
          Price: {
            x: 0,
            y: 120,
            text: {
              text: stock.price ? `$${stock.price.toFixed(2)}` : "Loading...",
              fontSize: 36,
              fontStyle: FontStyle.Bold,
              textColor: Colors.white,
              fontFace: FontFamily.Default,
            },
          },

          // Change - Color coded
          Change: {
            x: 0,
            y: 165,
            text: {
              text:
                stock.change && stock.changePct
                  ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(
                      2
                    )} (${stock.changePct.toFixed(2)}%)`
                  : "",
              fontSize: 18,
              fontStyle: FontStyle.Bold,
              textColor: isPositive ? 0xff22c55e : 0xffef4444,
              fontFace: FontFamily.Default,
            },
          },
        },
      };

      grid.childList.a(card);
    });

    console.log(`✅ ${this.searchResults.length} cards built successfully`);

    // Quick fade-in animation for new cards
    requestAnimationFrame(() => {
      this.searchResults.forEach((_, index) => {
        const card = grid.tag(`Card_${index}`);
        if (card) {
          // Minimal stagger for smooth appearance
          setTimeout(() => {
            card.setSmooth("alpha", 1, { duration: 0.15 });
          }, index * 15); // 15ms delay between each card (faster)
        }
      });
    });

    if (this.currentFocus === "cards" && this.selectedCardIndex >= 0) {
      this._updateCardFocus();
    }
  }

  private _updateKeyboardFocus(): void {
    this.keyboard.forEach((row, rowIndex) => {
      row.forEach((key, colIndex) => {
        // Skip second SPACE placeholder
        if (key === "SPACE" && colIndex === 3) return;

        const keyTag = this.tag(`Key_${rowIndex}_${colIndex}`);
        if (keyTag) {
          const isFocused =
            this.currentFocus === "keyboard" &&
            rowIndex === this.selectedKeyRow &&
            colIndex === this.selectedKeyCol;

          keyTag.setSmooth("color", isFocused ? Colors.success : 0xff2a2a2a, {
            duration: 0.2,
          });
          keyTag.setSmooth("scale", isFocused ? 1.08 : 1, { duration: 0.2 });
        }
      });
    });
  }

  private _updateCardFocus(): void {
    this.searchResults.forEach((_, index) => {
      const card = this.tag(`Card_${index}`);
      if (card) {
        const border = card.tag("Border");
        const isFocused =
          this.currentFocus === "cards" && index === this.selectedCardIndex;

        if (border) {
          border.setSmooth("alpha", isFocused ? 1 : 0, { duration: 0.2 });
        }
        card.setSmooth("scale", isFocused ? 1.08 : 1, { duration: 0.25 });
      }
    });
  }

  private _updateQueryDisplay(): void {
    const queryText = this.tag("QueryText");
    const cursor = this.tag("Cursor");

    if (queryText) {
      const hasQuery = this.searchQuery.length > 0;

      queryText.patch({
        text: {
          text: hasQuery ? this.searchQuery : "Type to search...",
          textColor: hasQuery ? Colors.white : 0xff666666,
        },
      });

      if (cursor) {
        // Wait for text to render before positioning cursor
        requestAnimationFrame(() => {
          if (queryText && cursor) {
            cursor.patch({
              x: hasQuery ? queryText.renderWidth + 2 : 0,
              alpha: hasQuery ? 1 : 0,
            });
          }
        });
      }
    }
  }

  private _handleKeyPress(key: string): void {
    if (key === "⌫") {
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this._updateQueryDisplay();
        this._debouncedSearch();
      }
    } else if (key === "CLR") {
      this.searchQuery = "";
      this._updateQueryDisplay();
      this._clearSearch();
    } else if (key === "SPACE") {
      this.searchQuery += " ";
      this._updateQueryDisplay();
      this._debouncedSearch();
    } else if (key.length === 1) {
      this.searchQuery += key;
      this._updateQueryDisplay();
      this._debouncedSearch();
    }
  }

  private _debouncedSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this._performSearch();
    }, 100); // Fast response - 100ms debounce
  }

  private async _performSearch(): Promise<void> {
    // Empty query - show popular stocks
    if (this.searchQuery.length === 0) {
      this._loadPopularStocks();
      return;
    }

    // Single character or more - search immediately!
    try {
      console.log(`✅ Searching for: "${this.searchQuery}"`);
      const results = await stocksApi.search(this.searchQuery);
      console.log(`✅ Found ${results.length} results`);

      if (results.length === 0) {
        console.log("📭 No results found");
        this.searchResults = [];
        this._buildStockCards();
        return;
      }

      // Limit to 18 cards for performance
      await this._loadStockDetails(results.slice(0, 18));
    } catch (error) {
      console.error("❌ Search failed:", error);
      this.searchResults = [];
      this._buildStockCards();
    }
  }

  private _clearSearch(): void {
    this._loadPopularStocks();
  }

  private _selectCurrentItem(): void {
    if (this.currentFocus === "cards" && this.selectedCardIndex >= 0) {
      const selected = this.searchResults[this.selectedCardIndex];
      if (selected) {
        this._fireStockSelection(selected);
      }
    } else if (this.currentFocus === "keyboard") {
      const key = this.keyboard[this.selectedKeyRow][this.selectedKeyCol];
      this._handleKeyPress(key);
    }
  }

  private _fireStockSelection(stock: SearchResult): void {
    console.log(`✅ Selected stock: ${stock.symbol} - ${stock.name}`);
    this.fireAncestors("$selectStockFromSearch", {
      symbol: stock.symbol,
      name: stock.name,
    });
    this.fireAncestors("$closeSearch");
  }

  // Navigation
  override _handleUp(): boolean {
    if (this.currentFocus === "keyboard") {
      if (this.selectedKeyRow > 0) {
        this.selectedKeyRow--;
        // Adjust column if out of bounds
        if (this.selectedKeyCol >= this.keyboard[this.selectedKeyRow].length) {
          this.selectedKeyCol = this.keyboard[this.selectedKeyRow].length - 1;
        }
        // Skip second SPACE placeholder
        if (
          this.keyboard[this.selectedKeyRow][this.selectedKeyCol] === "SPACE" &&
          this.selectedKeyCol === 3
        ) {
          this.selectedKeyCol = 2;
        }
        this._updateKeyboardFocus();
      }
    } else if (this.currentFocus === "cards") {
      const newIndex = this.selectedCardIndex - 3;
      if (newIndex >= 0) {
        this.selectedCardIndex = newIndex;
        this._updateCardFocus();
      }
    }
    return true;
  }

  override _handleDown(): boolean {
    if (this.currentFocus === "keyboard") {
      if (this.selectedKeyRow < this.keyboard.length - 1) {
        this.selectedKeyRow++;
        // Adjust column if out of bounds
        if (this.selectedKeyCol >= this.keyboard[this.selectedKeyRow].length) {
          this.selectedKeyCol = this.keyboard[this.selectedKeyRow].length - 1;
        }
        // Skip second SPACE placeholder
        if (
          this.keyboard[this.selectedKeyRow][this.selectedKeyCol] === "SPACE" &&
          this.selectedKeyCol === 3
        ) {
          this.selectedKeyCol = 2;
        }
        this._updateKeyboardFocus();
      }
    } else if (this.currentFocus === "cards") {
      const newIndex = this.selectedCardIndex + 3;
      if (newIndex < this.searchResults.length) {
        this.selectedCardIndex = newIndex;
        this._updateCardFocus();
      }
    }
    return true;
  }

  override _handleLeft(): boolean {
    if (this.currentFocus === "keyboard") {
      if (this.selectedKeyCol > 0) {
        this.selectedKeyCol--;
        // Skip second SPACE placeholder
        if (
          this.keyboard[this.selectedKeyRow][this.selectedKeyCol] === "SPACE" &&
          this.selectedKeyCol === 3
        ) {
          this.selectedKeyCol = 2;
        }
        this._updateKeyboardFocus();
      }
    } else if (this.currentFocus === "cards") {
      if (this.selectedCardIndex % 3 > 0) {
        this.selectedCardIndex--;
        this._updateCardFocus();
      } else {
        // Move back to keyboard
        this.currentFocus = "keyboard";
        this.selectedCardIndex = -1;
        this._updateKeyboardFocus();
        this._updateCardFocus();
      }
    }
    return true;
  }

  override _handleRight(): boolean {
    if (this.currentFocus === "keyboard") {
      const maxCol = this.keyboard[this.selectedKeyRow].length - 1;
      // Handle SPACE key which spans 2 columns
      if (
        this.keyboard[this.selectedKeyRow][this.selectedKeyCol] === "SPACE" &&
        this.selectedKeyCol === 2
      ) {
        this.selectedKeyCol = 4; // Jump to backspace
        this._updateKeyboardFocus();
      } else if (this.selectedKeyCol < maxCol) {
        this.selectedKeyCol++;
        // Skip second SPACE placeholder
        if (
          this.keyboard[this.selectedKeyRow][this.selectedKeyCol] === "SPACE" &&
          this.selectedKeyCol === 3
        ) {
          this.selectedKeyCol = 4;
        }
        this._updateKeyboardFocus();
      } else if (this.searchResults.length > 0) {
        // Move to cards
        this.currentFocus = "cards";
        this.selectedCardIndex = 0;
        this._updateKeyboardFocus();
        this._updateCardFocus();
      }
    } else if (this.currentFocus === "cards") {
      if (
        (this.selectedCardIndex + 1) % 3 !== 0 &&
        this.selectedCardIndex < this.searchResults.length - 1
      ) {
        this.selectedCardIndex++;
        this._updateCardFocus();
      }
    }
    return true;
  }

  override _handleEnter(): boolean {
    this._selectCurrentItem();
    return true;
  }

  override _handleBack(): boolean {
    console.log("✅ Closing search screen");
    this.fireAncestors("$closeSearch");
    return true;
  }

  // Laptop keyboard support
  override _captureKey(event: KeyboardEvent): boolean {
    const key = event.key;

    if (key === "Backspace" && this.currentFocus === "keyboard") {
      this.searchQuery = this.searchQuery.slice(0, -1);
      this._updateQueryDisplay();
      this._debouncedSearch();
      return true;
    } else if (key === " " && this.currentFocus === "keyboard") {
      this.searchQuery += " ";
      this._updateQueryDisplay();
      this._debouncedSearch();
      return true;
    } else if (
      key.length === 1 &&
      /[a-zA-Z0-9.-]/.test(key) &&
      this.currentFocus === "keyboard"
    ) {
      this.searchQuery += key.toLowerCase();
      this._updateQueryDisplay();
      this._debouncedSearch();
      return true;
    }

    return false;
  }
}
