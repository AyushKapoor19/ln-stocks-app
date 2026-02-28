/**
 * Full-Screen Search Experience
 * Layout: 1/3 keyboard panel + 2/3 results carousel
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "./BaseScreen";
import { stocksApi, type SearchResult } from "../services/api";
import { Colors } from "../constants/Colors";
import { FontStyle, FontFamily } from "../constants/Fonts";

interface StockCardData extends SearchResult {
  price?: number;
  change?: number;
  changePct?: number;
  description?: string;
}

const gridConfig = {
  cardWidth: 380,
  cardHeight: 260,
  spacing: 20,
  columns: 3,
  viewportHeight: 920,
  titleHeight: 80,
};

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
  private gridScrollY = 0;
  private isTitleVisible = true;

  // Compact 6-column keyboard layout - Alphabets first for convenience
  private keyboard = [
    ["a", "b", "c", "d", "e", "f"],
    ["g", "h", "i", "j", "k", "l"],
    ["m", "n", "o", "p", "q", "r"],
    ["s", "t", "u", "v", "w", "x"],
    ["y", "z", "1", "2", "3", "4"],
    ["5", "6", "7", "8", "9", "0"],
    [".", "-", "SPACE", "SPACE", "⌫", "CLR"],
  ];

  static override _template(): Lightning.Component.Template {
    const LEFT_PANEL_WIDTH = 640; // 1/3 of 1920
    const RIGHT_PANEL_WIDTH = 1280; // 2/3 of 1920
    const RIGHT_PANEL_X = LEFT_PANEL_WIDTH;

    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: Colors.black,

      // Left Panel - Compact Keyboard (1/3 screen)
      LeftPanel: {
        x: 0,
        y: 0,
        w: LEFT_PANEL_WIDTH,
        h: 1080,
        rect: true,
        color: Colors.backgroundDarkGray,

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
              textColor: Colors.sectionTitleColor,
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
            textColor: Colors.sectionTitleColor,
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
            text: "Popular Stocks",
            fontSize: 48,
            fontStyle: FontStyle.Bold,
            textColor: Colors.white,
            fontFace: FontFamily.Default,
          },
        },

        NoResultsMessage: {
          x: 640,
          y: 400,
          mountX: 0.5,
          alpha: 0,
          w: 800,

          Icon: {
            x: 400,
            y: 0,
            w: 80,
            h: 80,
            mountX: 0.5,
            src: "assets/icons/no-results-icon.png",
          },

          Message: {
            x: 400,
            y: 120,
            mountX: 0.5,
            text: {
              text: "No results found",
              fontSize: 42,
              fontStyle: FontStyle.Bold,
              textColor: Colors.textQuaternary,
              fontFace: FontFamily.Default,
            },
          },

          Suggestion: {
            x: 400,
            y: 180,
            mountX: 0.5,
            text: {
              text: "Try a different search term",
              fontSize: 28,
              textColor: Colors.sectionTitleColor,
              fontFace: FontFamily.Default,
            },
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

    this._buildKeyboard();
    this._startCursorBlink();
    this._loadPopularStocks();
  }

  override _attach(): void {
    super._attach();
    // Reset focus to first key (row 0, col 0 - letter "a") whenever screen is opened
    this.selectedKeyRow = 0;
    this.selectedKeyCol = 0;
    this.currentFocus = "keyboard";
    this.selectedCardIndex = -1;
    this._updateKeyboardFocus();
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
          color: Colors.keyUnfocused,
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

      await this._loadStockDetails(popularStocks);
    } catch (error) {}
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
      } catch (error) {}
    });

    // Wait for all prices to load
    await Promise.all(pricePromises);
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
              2,
            )} (${stock.changePct.toFixed(2)}%)`
          : "";
      changeTag.text.textColor = isPositive ? Colors.success : Colors.error;
    }

    const gradient = card.tag("GradientOverlay");
    if (gradient) {
      gradient.patch({
        colorTop: isPositive ? Colors.gradientGreenLight : Colors.gradientRedLight,
      });
    }
  }

  private _buildStockCards(): void {
    const grid = this.tag("CardsGrid");
    if (!grid) {
      return;
    }

    // Quick fade-out and immediate render for speed
    const existingCards = grid.children || [];
    if (existingCards.length > 0) {
      existingCards.forEach((card: Lightning.Component) => {
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

    // Reset scroll position for new results
    this.gridScrollY = 0;
    grid.y = 130;

    // Reset title visibility and text
    const title = this.tag("RightPanel")?.tag("TopResultsTitle");
    if (title) {
      title.alpha = 1;
      title.y = 50;
      this.isTitleVisible = true;
    }

    // Update title text based on search state
    this._updateTitleText();

    grid.childList.clear();

    // Show/hide "No results found" message
    const noResultsMessage = this.tag("RightPanel")?.tag("NoResultsMessage");
    const hasQuery = this.searchQuery.length > 0;
    const hasResults = this.searchResults.length > 0;

    if (noResultsMessage) {
      if (hasQuery && !hasResults) {
        // Show no results message
        noResultsMessage.setSmooth("alpha", 1, { duration: 0.3 });
      } else {
        // Hide no results message
        noResultsMessage.setSmooth("alpha", 0, { duration: 0.2 });
      }
    }

    // If no results and user has searched, don't build cards
    if (hasQuery && !hasResults) {
      return;
    }

    this.searchResults.forEach((stock, index) => {
      const row = Math.floor(index / gridConfig.columns);
      const col = index % gridConfig.columns;

      const isPositive = stock.change && stock.change >= 0;

      const card = {
        ref: `Card_${index}`,
        x: col * (gridConfig.cardWidth + gridConfig.spacing),
        y: row * (gridConfig.cardHeight + gridConfig.spacing),
        w: gridConfig.cardWidth,
        h: gridConfig.cardHeight,
        rect: true,
        color: Colors.cardBackgroundMedium,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },
        alpha: 0,

        GradientOverlay: {
          x: 0,
          y: 0,
          w: gridConfig.cardWidth,
          h: gridConfig.cardHeight,
          rect: true,
          colorTop: isPositive ? Colors.gradientGreenDark : Colors.gradientRedDark,
          colorBottom: Colors.transparent,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 24 },
        },

        Content: {
          x: 32,
          y: 32,
          w: gridConfig.cardWidth - 64,
          h: gridConfig.cardHeight - 64,

          // Symbol - Bold and prominent
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

          // Company Name - Elegant grey
          Name: {
            x: 0,
            y: 54,
            text: {
              text:
                stock.name.length > 22
                  ? stock.name.substring(0, 22) + "..."
                  : stock.name,
              fontSize: 24,
              textColor: Colors.textQuaternary,
              fontFace: FontFamily.Default,
              wordWrap: false,
              maxLines: 1,
            },
          },

          // Price - Hero element, extra large
          Price: {
            x: 0,
            y: 123,
            text: {
              text: stock.price ? `$${stock.price.toFixed(2)}` : "Loading...",
              fontSize: 45,
              fontStyle: FontStyle.SemiBold,
              textColor: Colors.white,
              fontFace: FontFamily.Default,
            },
          },

          // Change - Clear and color-coded
          Change: {
            x: 0,
            y: 178,
            text: {
              text:
                stock.change && stock.changePct
                  ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(
                      2,
                    )} (${stock.changePct.toFixed(2)}%)`
                  : "",
              fontSize: 22,
              fontStyle: FontStyle.Body,
              textColor: isPositive ? Colors.success : Colors.error,
              fontFace: FontFamily.Default,
            },
          },
        },
      };

      grid.childList.a(card);
    });

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

          // White background with black text when focused (like sign in/sign up keyboard)
          keyTag.setSmooth("color", isFocused ? Colors.keyFocused : Colors.keyUnfocused, {
            duration: 0.2,
          });
          keyTag.setSmooth("scale", isFocused ? 1.08 : 1, { duration: 0.2 });

          // Update text color
          const label = keyTag.tag("Label");
          if (label) {
            label.patch({
              text: {
                textColor: isFocused ? Colors.black : Colors.white,
              },
            });
          }
        }
      });
    });
  }

  private _updateCardFocus(): void {
    this.searchResults.forEach((stock, index) => {
      const card = this.tag(`Card_${index}`);
      if (card) {
        const gradientOverlay = card.tag("GradientOverlay");
        const isFocused =
          this.currentFocus === "cards" && index === this.selectedCardIndex;

        // Determine stock performance
        const isPositive = stock.change && stock.change >= 0;

        // Gradient colors - dramatic difference between states
        const primaryGradientUnfocused = isPositive ? Colors.gradientGreenDark : Colors.gradientRedDark;
        const primaryGradientFocused = isPositive ? Colors.gradientGreenFocused : Colors.gradientRedFocused;

        if (gradientOverlay) {
          gradientOverlay.patch({
            colorTop: isFocused
              ? primaryGradientFocused
              : primaryGradientUnfocused,
          });
        }

        // Subtle background darkening when focused (adds depth)
        card.setSmooth("color", isFocused ? Colors.cardBackgroundDarker : Colors.cardBackgroundMedium, {
          duration: 0.2,
        });

        // Smooth scale animation (subtle emphasis)
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
          textColor: hasQuery ? Colors.white : Colors.sectionTitleColor,
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

    // Update title text based on search state
    this._updateTitleText();
  }

  /**
   * Updates the title text based on whether user is searching or not
   */
  private _updateTitleText(): void {
    const title = this.tag("RightPanel")?.tag("TopResultsTitle");
    if (!title || !title.text) return;

    const hasQuery = this.searchQuery.length > 0;
    const newText = hasQuery ? "Top Results" : "Popular Stocks";

    if (title.text.text !== newText) {
      title.patch({
        text: {
          text: newText,
        },
      });
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
      const results = await stocksApi.search(this.searchQuery);

      if (results.length === 0) {
        this.searchResults = [];
        this._buildStockCards();
        return;
      }

      // Limit to 18 cards for performance
      await this._loadStockDetails(results.slice(0, 18));
    } catch (error) {
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
    this.fireAncestors("$selectStockFromSearch", {
      symbol: stock.symbol,
      name: stock.name,
    });
    this.fireAncestors("$closeSearch");
  }

  /**
   * Scrolls the grid to keep the focused card visible
   */
  private _scrollGridToCard(): void {
    if (this.selectedCardIndex < 0) return;

    const grid = this.tag("CardsGrid");
    if (!grid) return;

    const rowHeight = gridConfig.cardHeight + gridConfig.spacing;

    // Calculate which row the selected card is in
    const currentRow = Math.floor(this.selectedCardIndex / gridConfig.columns);
    const cardY = currentRow * rowHeight;

    // Calculate visible range
    const visibleTop = -this.gridScrollY;
    const visibleBottom = visibleTop + gridConfig.viewportHeight;

    // Check if card is outside visible area
    if (cardY < visibleTop) {
      // Card is above visible area - scroll up
      this.gridScrollY = -cardY;
      grid.setSmooth("y", 130 + this.gridScrollY, { duration: 0.3 });
    } else if (cardY + gridConfig.cardHeight > visibleBottom) {
      // Card is below visible area - scroll down
      this.gridScrollY = -(
        cardY -
        gridConfig.viewportHeight +
        gridConfig.cardHeight
      );

      grid.setSmooth("y", 130 + this.gridScrollY, { duration: 0.3 });
    }

    // Update title visibility based on scroll position
    this._updateTitleVisibility();
  }

  /**
   * Shows or hides the "Top Results" title based on scroll position
   */
  private _updateTitleVisibility(): void {
    const title = this.tag("RightPanel")?.tag("TopResultsTitle");
    if (!title) return;

    const shouldShowTitle = this.gridScrollY === 0;

    if (shouldShowTitle && !this.isTitleVisible) {
      // Show title when scrolled to top
      title.setSmooth("alpha", 1, { duration: 0.3 });
      title.setSmooth("y", 50, { duration: 0.3 });
      this.isTitleVisible = true;
    } else if (!shouldShowTitle && this.isTitleVisible) {
      // Hide title when scrolled away
      title.setSmooth("alpha", 0, { duration: 0.3 });
      title.setSmooth("y", 20, { duration: 0.3 });
      this.isTitleVisible = false;
    }
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
        this._scrollGridToCard();
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
        this._scrollGridToCard();
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
        this._scrollGridToCard();
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
        this._scrollGridToCard();
        this._updateKeyboardFocus();
        this._updateCardFocus();
      }
    } else if (this.currentFocus === "cards") {
      if (
        (this.selectedCardIndex + 1) % 3 !== 0 &&
        this.selectedCardIndex < this.searchResults.length - 1
      ) {
        this.selectedCardIndex++;
        this._scrollGridToCard();
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
    // Cards (index > 0) → Cards (index 0) --> Keyboard --> Home
    if (this.currentFocus === "cards") {
      if (this.selectedCardIndex > 0) {
        // Go to first card (index 0)
        this.selectedCardIndex = 0;
        this._scrollGridToCard();
        this._updateCardFocus();
        return true;
      } else {
        // Already on first card, go back to keyboard
        this.currentFocus = "keyboard";
        this.selectedCardIndex = -1;
        this._updateKeyboardFocus();
        this._updateCardFocus();
        return true;
      }
    } else if (this.currentFocus === "keyboard") {
      // On keyboard, close search and go to home

      this.fireAncestors("$closeSearch");
      return true;
    }
    return false;
  }

  // Laptop keyboard support
  override _captureKey(event: KeyboardEvent): boolean {
    const key = event.key;

    if (key === "Backspace" && this.currentFocus === "keyboard") {
      // Only capture backspace if there's text to delete
      // Otherwise, let it pass through to _handleBack for navigation
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this._updateQueryDisplay();
        this._debouncedSearch();
        return true;
      }
      return false;
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
