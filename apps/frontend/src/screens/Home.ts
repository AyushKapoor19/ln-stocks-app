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
  ];

  static _template(): object {
    return {
      w: (w: number) => w,
      h: (h: number) => h,
      rect: true,
      color: Colors.black,

      SearchBar: {
        type: SearchBar,
        x: 1280,
        y: 40,
      },

      SignInButton: {
        x: 1700,
        y: 40,
        w: 80,
        h: 56,
        rect: true,
        color: Colors.transparent,
        Background: {
          w: 80,
          h: 56,
          rect: true,
          color: Colors.buttonUnfocused,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 28 },
        },
        Icon: {
          x: 40,
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
        x: 1280,
        y: 106,
        alpha: 0,
      },

      TimeSelectorContainer: Object.assign(
        {
          x: 40,
          y: 520,
          w: 70,
          h: 400,
        },
        TIME_PERIODS.reduce(
          (acc: Record<string, object>, period: TimePeriod, index: number) => {
            acc[`TimeButton_${period.id}`] = {
              y: index * 70,
              w: 65,
              h: 50,
              Background: {
                w: 65,
                h: 50,
                rect: true,
                color: Colors.buttonUnfocused,
                shader: {
                  type: Lightning.shaders.RoundedRectangle,
                  radius: 10,
                },
              },
              Label: {
                x: 32.5,
                y: 25,
                mount: 0.5,
                text: {
                  text: period.label,
                  fontFace: FontFamily.Default,
                  fontSize: FontSize.Small,
                  textColor: Colors.textUnfocused,
                  fontStyle: FontStyle.Bold,
                },
              },
            };
            return acc;
          },
          {}
        )
      ),

      MainDisplay: {
        x: 214,
        y: 40,
        StockSymbol: {
          text: {
            text: "VOO - Vanguard S&P 500 ETF",
            fontFace: FontFamily.Default,
            fontSize: FontSize.XLarge,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
          },
        },
        StockPrice: {
          y: 75,
          text: {
            text: "$428.75",
            fontFace: FontFamily.Default,
            fontSize: FontSize.XXLarge,
            fontStyle: FontStyle.SemiBold,
            textColor: Colors.stockGreenBright,
          },
        },
        StockChange: {
          y: 175,
          text: {
            text: "+2.45 (+0.57%)",
            fontFace: FontFamily.Default,
            fontSize: FontSize.Large,
            fontStyle: FontStyle.Medium,
            textColor: Colors.stockGreenBright,
          },
        },
      },

      ChartContainer: {
        x: 134,
        y: 250,
        w: 1760,
        h: 750,
        Chart: {
          type: StockChart,
          w: 1760,
          h: 750,
          chartWidth: 1760,
          chartHeight: 750,
          canvasLeft: 134,
          canvasTop: 250,
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
      this.currentFocusIndex = this.focusableElements.length - 1;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 1) {
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    } else {
      const currentButtonIndex = this.currentFocusIndex - 2;
      if (currentButtonIndex > 0) {
        this.currentFocusIndex = currentButtonIndex + 1;
        this._selectTimePeriod(currentButtonIndex - 1);
      } else {
        this.currentFocusIndex = 1;
        this._updateFocus();
      }
      return true;
    }
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
      this.currentFocusIndex = 1;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 1) {
      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    } else {
      const currentButtonIndex = this.currentFocusIndex - 2;
      if (currentButtonIndex < TIME_PERIODS.length - 1) {
        this.currentFocusIndex = currentButtonIndex + 3;
        this._selectTimePeriod(currentButtonIndex + 1);
      }
      return true;
    }
  }

  _handleLeft(): boolean {
    if (this.currentFocusIndex === 1) {
      this.currentFocusIndex = 0;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex === 0) {
      this.currentFocusIndex = 2;
      this._updateFocus();
      return true;
    }
    return false;
  }

  _handleRight(): boolean {
    if (this.currentFocusIndex === 0) {
      this.currentFocusIndex = 1;
      this._updateFocus();
      return true;
    } else if (this.currentFocusIndex > 1) {
      this.currentFocusIndex = 0;
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
      console.log("🔐 Opening Sign In screen");
      this.fireAncestors("$navigateToSignIn");
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
          background.setSmooth("color", Colors.buttonFocused, { duration: 0.2 });
        } else {
          background.setSmooth("color", Colors.buttonUnfocused, { duration: 0.2 });
        }
      }
    }

    const container = this.tag("TimeSelectorContainer");
    if (container) {
      TIME_PERIODS.forEach((period, index) => {
        const button = container.tag(`TimeButton_${period.id}`);
        if (button) {
          const isFocused = this.currentFocusIndex === index + 2;
          const background = button.tag("Background");
          const label = button.tag("Label");
          if (background) {
            const isSelected = index === this.selectedPeriodIndex;
            if (isFocused && isSelected) {
              background.setSmooth("color", Colors.buttonFocused, {
                duration: 0.2,
              });
              if (label && label.text) {
                label.text.textColor = Colors.textPrimary;
              }
            } else if (isFocused && !isSelected) {
              background.setSmooth("color", Colors.buttonHover, {
                duration: 0.2,
              });
              if (label && label.text) {
                label.text.textColor = Colors.textUnfocused;
              }
            } else {
              background.setSmooth("color", Colors.buttonUnfocused, {
                duration: 0.2,
              });
              if (label && label.text) {
                label.text.textColor = Colors.textUnfocused;
              }
            }
          }
        }
      });
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
}
