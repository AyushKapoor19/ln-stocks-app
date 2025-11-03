import { Lightning } from "@lightningjs/sdk";
import BeautifulChart from "../components/charts/BeautifulChart";
import { stocksApi } from "../services/api";

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

interface ChartComponent extends LightningComponent {
  points: number[];
  lineColor: string;
}

const TIME_PERIODS: TimePeriod[] = [
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "1Y", label: "1Y", days: 365 },
];

export default class Home extends Lightning.Component {
  private currentTimePeriod: TimePeriod = { id: "1M", label: "1M", days: 30 };
  private selectedPeriodIndex = 0; // Default to 1M (now first in list)
  private isLoading = false;
  private currentPrice = 428.75; // Default VOO price
  private currentChange = 2.45;
  private currentChangePct = 0.0057;
  private currentSymbol = "VOO"; // Current stock symbol
  private currentStockName = "Vanguard S&P 500 ETF";
  private searchQuery = "";
  private searchResults: any[] = [];
  private selectedSearchIndex = 0;
  private isSearchActive = false;
  private searchTimeout: any = null; // Debounce search

  static _template(): object {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: 0xff000000, // Pure black background

      // Professional Search Bar
      SearchBar: {
        x: 1920 - 420,
        y: 40,
        w: 380,
        h: 56,
        Background: {
          w: 380,
          h: 56,
          rect: true,
          color: 0xee1a1a1a, // Dark professional gray
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 28 },
        },
        SearchIcon: {
          x: 24,
          y: 28,
          mount: 0.5,
          text: {
            text: "🔍",
            fontSize: 22,
          },
        },
        SearchLabel: {
          x: 60,
          y: 10,
          text: {
            text: "Search stocks...",
            fontSize: 24,
            fontWeight: 700,
            textColor: 0xffffffff,
            fontFace: "Avenir Next",
          },
        },
      },

      // Professional Search Results Dropdown
      SearchResults: {
        x: 1920 - 420,
        y: 106,
        w: 380,
        alpha: 0,
        // Outer shadow for depth
        OuterShadow: {
          w: 390,
          h: 270,
          x: -5,
          y: -5,
          rect: true,
          color: 0x66000000,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },
        },
        // Main background with border
        Background: {
          w: 380,
          h: 260,
          rect: true,
          color: 0xff1c1c1e, // Slightly lighter dark
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
        },
        // Subtle border/highlight
        Border: {
          w: 380,
          h: 260,
          rect: true,
          color: 0x33ffffff, // Subtle white border
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 16 },
        },
        // Content container
        ResultsList: {
          x: 12,
          y: 12,
        },
      },

      // Time selector buttons (left side, vertical)
      TimeSelectorContainer: Object.assign(
        {
          x: 50,
          y: 240,
          w: 60,
          h: 400,
        },
        TIME_PERIODS.reduce(
          (acc: Record<string, object>, period: TimePeriod, index: number) => {
            acc[`TimeButton_${period.id}`] = {
              y: index * 60,
              w: 50,
              h: 40,
              Background: {
                w: 50,
                h: 40,
                rect: true,
                color: 0x00000000, // Transparent initially
                shader: { type: Lightning.shaders.RoundedRectangle, radius: 8 },
              },
              Label: {
                x: 25,
                y: 20,
                mount: 0.5,
                text: {
                  text: period.label,
                  fontFace: "Avenir Next",
                  fontSize: 16,
                  textColor: period.id === "1W" ? 0xffffffff : 0x88ffffff,
                  fontWeight: 500,
                },
              },
            };
            return acc;
          },
          {}
        )
      ),

      // Main S&P 500 display
      MainDisplay: {
        x: 144,
        y: 50,
        StockSymbol: {
          text: {
            text: "VOO - Vanguard S&P 500 ETF", // Will be updated dynamically
            fontFace: "Avenir Next",
            fontSize: 48,
            fontWeight: 700,
            textColor: 0xffffffff,
          },
        },
        StockPrice: {
          y: 75,
          text: {
            text: "$428.75",
            fontFace: "Avenir Next",
            fontSize: 72,
            fontWeight: 600,
            textColor: 0xff00ff88, // Green color matching the image
          },
        },
        StockChange: {
          y: 165,
          text: {
            text: "+2.45 (+0.57%)",
            fontFace: "Avenir Next",
            fontSize: 26,
            fontWeight: 500,
            textColor: 0xff00ff88, // Same green color
          },
        },
      },

      // Large chart area - positioned below text with clear gap
      ChartContainer: {
        x: 134,
        y: 380,
        w: 1600,
        h: 520,
        Chart: {
          type: BeautifulChart,
          w: 1600,
          h: 520,
        },
      },
    };
  }

  _init(): void {
    console.log("📊 Initializing Stock Dashboard...");
    this._loadStockData(this.currentSymbol);
  }

  async _active(): Promise<void> {
    try {
      console.log(`🚀 Stock Dashboard ready (${this.currentSymbol})`);
      // Refresh data when component becomes active
      this._loadStockData(this.currentSymbol);
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
    }
  }

  private async _loadStockData(symbol: string): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    console.log(
      `📈 Loading ${symbol} data for period: ${this.currentTimePeriod.id}`
    );

    try {
      // Fetch real stock data from backend (works for any symbol)
      const [quote, series] = await Promise.all([
        stocksApi.getQuote(symbol),
        stocksApi.getSeries(symbol, this.currentTimePeriod.id),
      ]);

      // ALWAYS use the REAL quote price for display (from Finnhub)
      if (quote) {
        this.currentPrice = quote.price;
        this.currentChange = quote.change;
        this.currentChangePct = quote.changePct;
        this._updatePriceDisplay();

        console.log(
          `✅ Using REAL Finnhub price: $${quote.price} (${
            quote.change >= 0 ? "+" : ""
          }${quote.change})`
        );
      }

      // Update chart if series data is available (for visualization only)
      if (series) {
        const chartData = stocksApi.formatSeriesForChart(series);
        if (chartData.length > 0) {
          // Pass full series data with timestamps to chart
          this._updateChartWithTimestamps(series);

          console.log(
            `✅ Loaded ${chartData.length} chart points from ${series.source}`
          );
        } else {
          console.warn("⚠️ No chart data available, using fallback");
          this._loadFallbackData();
        }
      } else {
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
      // Update price
      const priceElement = mainDisplay.tag("StockPrice");
      if (priceElement) {
        priceElement.text.text = stocksApi.formatPrice(this.currentPrice);
      }

      // Update change with color
      const changeElement = mainDisplay.tag("StockChange");
      if (changeElement) {
        changeElement.text.text = stocksApi.formatChange(
          this.currentChange,
          this.currentChangePct
        );
        // Set color based on positive/negative change
        const changeColor = this.currentChange >= 0 ? 0xff00ff88 : 0xffff4444; // Green or red
        changeElement.text.textColor = changeColor;
      }
    }
  }

  private _updateChart(data: number[]): void {
    const chartContainer = this.tag("ChartContainer");
    if (chartContainer) {
      const chartComponent = chartContainer.tag("Chart");
      if (chartComponent) {
        (chartComponent as ChartComponent).points = data;
        (chartComponent as ChartComponent).lineColor =
          this.currentChange >= 0 ? "#00ff88" : "#ff4444"; // Green or red based on change
      }
    }
  }

  private _updateChartWithTimestamps(seriesData: any): void {
    const chartContainer = this.tag("ChartContainer");
    if (chartContainer) {
      const chartComponent = chartContainer.tag("Chart");
      if (chartComponent) {
        // Pass full series data with timestamps and period info
        (chartComponent as any).seriesData = seriesData;
        (chartComponent as any).lineColor =
          this.currentChange >= 0 ? "#00ff88" : "#ff4444"; // Green or red based on change
      }
    }
  }

  private _loadFallbackData(): void {
    // Generate realistic, consistent VOO fallback data matching backend
    const basePrice = 615.3;
    const pointCount =
      this.currentTimePeriod.days === 1
        ? 50
        : this.currentTimePeriod.days <= 30
        ? 100
        : 200;

    const fallbackData: number[] = [];

    // Use deterministic seed for consistency matching backend logic
    const seed = this.currentTimePeriod.id.charCodeAt(0);
    let seededRandom = seed;
    const deterministicRandom = () => {
      seededRandom = (seededRandom * 9301 + 49297) % 233280;
      return seededRandom / 233280;
    };

    for (let i = 0; i < pointCount; i++) {
      const timeProgress = i / pointCount;

      // Create realistic VOO price movements matching backend logic
      const periodMultiplier =
        {
          "1D": 0.002, // ±0.2% for intraday
          "1W": 0.005, // ±0.5% for weekly
          "1M": 0.015, // ±1.5% for monthly
          "3M": 0.03, // ±3% for quarterly
          "1Y": 0.08, // ±8% for yearly
        }[this.currentTimePeriod.id] || 0.01;

      // Create gradual trend with market-like volatility
      const trendDirection =
        this.currentTimePeriod.id === "1Y"
          ? 1
          : deterministicRandom() > 0.5
          ? 1
          : -1;
      const overallTrend =
        trendDirection * periodMultiplier * timeProgress * 0.3;

      // Add market cycles and realistic volatility
      const marketCycle =
        Math.sin(timeProgress * Math.PI * 2) * periodMultiplier * 0.4;
      const volatility = (deterministicRandom() - 0.5) * periodMultiplier * 0.8;
      const dailyVariation =
        Math.sin(timeProgress * Math.PI * 20) * periodMultiplier * 0.1;

      let price =
        basePrice *
        (1 + overallTrend + marketCycle + volatility + dailyVariation);

      // Ensure reasonable bounds for VOO
      price = Math.max(580, Math.min(650, price));
      fallbackData.push(Math.round(price * 100) / 100);
    }

    // Update price display with latest fallback data
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
    if (this.isSearchActive && this.searchResults.length > 0) {
      // Navigate search results
      if (this.selectedSearchIndex > 0) {
        this.selectedSearchIndex--;
        this._updateSearchSelection();
      }
    } else {
      // Navigate time periods
      if (this.selectedPeriodIndex > 0) {
        this._selectTimePeriod(this.selectedPeriodIndex - 1);
      }
    }
    return true;
  }

  _handleDown(): boolean {
    if (this.isSearchActive && this.searchResults.length > 0) {
      // Navigate search results
      if (this.selectedSearchIndex < this.searchResults.length - 1) {
        this.selectedSearchIndex++;
        this._updateSearchSelection();
      }
    } else {
      // Navigate time periods
      if (this.selectedPeriodIndex < TIME_PERIODS.length - 1) {
        this._selectTimePeriod(this.selectedPeriodIndex + 1);
      }
    }
    return true;
  }

  _handleEnter(): boolean {
    if (this.isSearchActive) {
      if (
        this.searchResults.length > 0 &&
        this.searchResults[this.selectedSearchIndex]
      ) {
        // Select the stock
        const selected = this.searchResults[this.selectedSearchIndex];
        this._selectStock(selected.symbol, selected.name);
      } else if (this.searchQuery.length >= 1) {
        // Search with current query
        this._performSearch();
      }
    } else {
      // Activate search
      this._activateSearch();
    }
    return true;
  }

  _handleKey(event: any): boolean {
    const key = event.key;

    // Activate search with 'S' or '/'
    if (!this.isSearchActive && (key === "s" || key === "S" || key === "/")) {
      this._activateSearch();
      return true;
    }

    // Handle typing when search is active
    if (this.isSearchActive) {
      if (key === "Backspace") {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this._updateSearchText();
        this._debouncedSearch();
        return true;
      } else if (key === "Escape") {
        this._deactivateSearch();
        return true;
      } else if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
        this.searchQuery += key.toUpperCase();
        this._updateSearchText();
        this._debouncedSearch();
        return true;
      }
    }

    return false;
  }

  private _selectTimePeriod(newIndex: number): void {
    const oldPeriod = TIME_PERIODS[this.selectedPeriodIndex];
    const newPeriod = TIME_PERIODS[newIndex];

    this.selectedPeriodIndex = newIndex;
    this.currentTimePeriod = newPeriod;

    // Update button appearances
    const container = this.tag("TimeSelectorContainer");
    if (container) {
      // Update old button
      const oldButton = container.tag(`TimeButton_${oldPeriod.id}`);
      if (oldButton) {
        const oldLabel = oldButton.tag("Label");
        const oldBackground = oldButton.tag("Background");
        if (oldLabel) {
          oldLabel.text.textColor = 0x88ffffff;
        }
        if (oldBackground) {
          oldBackground.setSmooth("alpha", 0, { duration: 0.3 });
        }
      }

      // Update new button
      const newButton = container.tag(`TimeButton_${newPeriod.id}`);
      if (newButton) {
        const newLabel = newButton.tag("Label");
        const newBackground = newButton.tag("Background");
        if (newLabel) {
          newLabel.text.textColor = 0xffffffff;
        }
        if (newBackground) {
          newBackground.color = 0x22ffffff;
          newBackground.setSmooth("alpha", 0.3, { duration: 0.3 });
        }
      }
    }

    console.log(`🕐 Time period changed to: ${newPeriod.label}`);

    // Load new data for the selected time period
    this._loadStockData(this.currentSymbol);
  }

  private _activateSearch(): void {
    this.isSearchActive = true;
    this.searchQuery = "";
    this.searchResults = [];

    // Update search bar appearance
    const searchBar = this.tag("SearchBar");
    if (searchBar) {
      // Update SearchLabel directly - simplest approach
      const searchLabel = searchBar.tag("SearchLabel");
      if (searchLabel && searchLabel.text) {
        searchLabel.text.text = "_";
        searchLabel.text.textColor = 0xffffffff;
        searchLabel.text.fontSize = 24; // Same as placeholder
        searchLabel.text.fontWeight = 700; // Same as placeholder
      }
    }

    console.log("🔍 Search activated - type to search!");
  }

  private _deactivateSearch(): void {
    this.isSearchActive = false;
    this.searchQuery = "";
    this._clearSearchResults();

    const searchBar = this.tag("SearchBar");
    if (searchBar) {
      // Restore SearchLabel to default
      const searchLabel = searchBar.tag("SearchLabel");
      if (searchLabel && searchLabel.text) {
        searchLabel.text.text = "Search stocks...";
        searchLabel.text.textColor = 0xffffffff; // WHITE
        searchLabel.text.fontSize = 24;
        searchLabel.text.fontWeight = 700;
      }
    }

    console.log("🔍 Search deactivated");
  }

  private _updateSearchText(): void {
    const searchBar = this.tag("SearchBar");
    if (!searchBar) {
      console.log("❌ SearchBar not found!");
      return;
    }

    if (this.isSearchActive) {
      // Update SearchLabel text while searching
      const displayText =
        this.searchQuery.length > 0 ? `${this.searchQuery}_` : "_";

      const searchLabel = searchBar.tag("SearchLabel");
      if (searchLabel) {
        console.log(`🔍 Updating SearchLabel with: "${displayText}"`);
        console.log(`📝 Current text before:`, searchLabel.text);

        // Direct property assignment
        searchLabel.text.text = displayText;
        searchLabel.text.textColor = 0xffffffff;
        searchLabel.text.fontSize = 24; // Same as placeholder
        searchLabel.text.fontWeight = 700; // Same as placeholder

        console.log(`📝 Current text after:`, searchLabel.text);

        // Force stage update
        this.stage.update();
      } else {
        console.log("❌ SearchLabel not found!");
      }

      console.log(`✍️ Search query is now: "${displayText}"`);
    }
  }

  private _debouncedSearch(): void {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Clear results if query is empty
    if (this.searchQuery.length < 1) {
      this._clearSearchResults();
      return;
    }

    // Wait 500ms after user stops typing before searching
    this.searchTimeout = setTimeout(() => {
      this._performSearch();
    }, 500);
  }

  private async _performSearch(): Promise<void> {
    if (!this.searchQuery || this.searchQuery.length < 1) return;

    console.log(`🔍 Searching for: ${this.searchQuery}`);

    try {
      const results = await stocksApi.searchStocks(this.searchQuery);

      // Apply intelligent ranking to prioritize better matches
      const rankedResults = this._rankSearchResults(results, this.searchQuery);
      this.searchResults = rankedResults.slice(0, 4); // Show top 4 results
      this.selectedSearchIndex = 0;

      console.log(`✅ Found ${this.searchResults.length} results (ranked)`);

      this._showSearchResults();
    } catch (error) {
      console.error("❌ Search failed:", error);
      this.searchResults = [];
    }
  }

  private _rankSearchResults(results: any[], query: string): any[] {
    const queryUpper = query.toUpperCase();

    // Score each result based on relevance
    const scored = results.map((result) => {
      const symbol = (result.symbol || "").toUpperCase();
      const name = (result.name || "").toUpperCase();
      let score = 0;

      // PRIORITY 1: Exact symbol match (highest priority)
      if (symbol === queryUpper) {
        score += 1000;
      }
      // PRIORITY 2: Symbol starts with query
      else if (symbol.startsWith(queryUpper)) {
        score += 500;
        // Bonus: shorter symbols rank higher (AAPL > AAPLD)
        score += Math.max(0, 10 - symbol.length);
      }
      // PRIORITY 3: Symbol contains query
      else if (symbol.includes(queryUpper)) {
        score += 100;
        // Bonus: earlier position in symbol
        const position = symbol.indexOf(queryUpper);
        score += Math.max(0, 10 - position);
      }

      // PRIORITY 4: Name matches (lower priority than symbol)
      if (name.includes(queryUpper)) {
        score += 50;
        // Bonus: starts with query
        if (name.startsWith(queryUpper)) {
          score += 25;
        }
      }

      // Penalty for very long symbols (likely less relevant)
      if (symbol.length > 6) {
        score -= 5;
      }

      return Object.assign({}, result, { _score: score });
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b._score - a._score);

    console.log(
      `📊 Top results for "${query}":`,
      scored.slice(0, 4).map((r) => `${r.symbol} (score: ${r._score})`)
    );

    return scored;
  }

  private _showSearchResults(): void {
    const resultsContainer = this.tag("SearchResults");
    if (!resultsContainer) return;

    resultsContainer.setSmooth("alpha", 1, { duration: 0.2 });

    const resultsList = resultsContainer.tag("ResultsList");
    if (!resultsList) return;

    // Clear old results
    resultsList.children = [];

    // Add new results
    this.searchResults.forEach((result, index) => {
      const isSelected = index === this.selectedSearchIndex;

      resultsList.childList.add({
        ref: `Result_${index}`,
        y: index * 58 + (index > 0 ? 2 : 0),
        w: 356,
        h: 56,
        rect: true,
        clipping: true,
        color: isSelected ? 0xff2a2a2e : 0xff1e1e20,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
        // Left accent bar - inside card with rounded ends
        AccentBar: {
          x: 1,
          y: 1,
          w: 4,
          h: 54,
          rect: true,
          color: isSelected ? 0xff00ff88 : 0x00000000,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: [9, 0, 0, 9],
          },
        },
        // Symbol with better styling
        Symbol: {
          x: 20,
          y: 14,
          text: {
            text: result.symbol,
            fontFace: "Avenir Next",
            fontSize: 19,
            fontWeight: 700,
            textColor: isSelected ? 0xffffffff : 0xffeeeeee,
            letterSpacing: 0.5,
          },
        },
        // Company name with better hierarchy
        Name: {
          x: 20,
          y: 36,
          w: 320,
          text: {
            text:
              result.name.length > 38
                ? `${result.name.substring(0, 38)}...`
                : result.name,
            fontFace: "Avenir Next",
            fontSize: 12,
            textColor: isSelected ? 0xffaaaaaa : 0xff888888,
            maxLines: 1,
            wordWrap: false,
          },
        },
        // Subtle arrow indicator for selected
        Arrow: {
          x: 330,
          y: 28,
          mount: 0.5,
          alpha: isSelected ? 1 : 0,
          text: {
            text: "→",
            fontSize: 20,
            textColor: 0xff00ff88,
          },
        },
      });
    });
  }

  private _updateSearchSelection(): void {
    const resultsList = this.tag("SearchResults")?.tag("ResultsList");
    if (!resultsList) return;

    this.searchResults.forEach((result, index) => {
      const resultItem = resultsList.tag(`Result_${index}`);
      if (resultItem) {
        const isSelected = index === this.selectedSearchIndex;

        // Update card background color
        resultItem.setSmooth("color", isSelected ? 0xff2a2a2e : 0xff1e1e20, {
          duration: 0.15,
        });

        // Update accent bar
        const accent = resultItem.tag("AccentBar");
        if (accent) {
          accent.setSmooth("color", isSelected ? 0xff00ff88 : 0x00000000, {
            duration: 0.15,
          });
        }

        // Update symbol text color
        const symbol = resultItem.tag("Symbol");
        if (symbol && symbol.text) {
          symbol.text.textColor = isSelected ? 0xffffffff : 0xffeeeeee;
        }

        // Update name text color
        const name = resultItem.tag("Name");
        if (name && name.text) {
          name.text.textColor = isSelected ? 0xffaaaaaa : 0xff888888;
        }

        // Update arrow visibility
        const arrow = resultItem.tag("Arrow");
        if (arrow) {
          arrow.setSmooth("alpha", isSelected ? 1 : 0, { duration: 0.15 });
        }
      }
    });

    // Force stage update for smooth rendering
    this.stage.update();
  }

  private _clearSearchResults(): void {
    const resultsContainer = this.tag("SearchResults");
    if (resultsContainer) {
      resultsContainer.setSmooth("alpha", 0, { duration: 0.2 });
    }
    this.searchResults = [];
  }

  private async _selectStock(symbol: string, name: string): Promise<void> {
    console.log(`✅ Selected stock: ${symbol} - ${name}`);

    this.currentSymbol = symbol;
    this.currentStockName = name;

    // Update title
    const mainDisplay = this.tag("MainDisplay");
    if (mainDisplay) {
      const titleElement = mainDisplay.tag("StockSymbol");
      if (titleElement) {
        titleElement.text.text = `${symbol} - ${name}`;
      }
    }

    // Deactivate search and load new stock data
    this._deactivateSearch();
    await this._loadStockData(symbol);
  }

  _getFocused(): Lightning.Component {
    return this; // Keep focus on main component for navigation
  }
}
