import { Lightning } from "@lightningjs/sdk";
import BaseComponent from "./BaseComponent";
import { stocksApi } from "../services/api";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import {
  ISearchResult,
  ISelectStockEvent,
  ISearchActivatedEvent,
  ISearchDeactivatedEvent,
  IShowSearchResultsEvent,
  IUpdateSearchSelectionEvent,
  INavigateSearchResultsEvent,
  IClearSearchResultsEvent,
} from "../types/events";

/**
 * SearchBar Component
 *
 * All dimensions are defined in 1080p coordinates.
 * Lightning.js automatically scales based on actual device resolution.
 */
export default class SearchBar extends BaseComponent {
  private searchQuery = "";
  private searchResults: ISearchResult[] = [];
  private selectedSearchIndex = 0;
  private searchTimeout: NodeJS.Timeout | undefined = undefined;
  private isFocused = false;
  private cursorBlinkInterval: NodeJS.Timeout | undefined = undefined;
  private cursorVisible = true;

  static _template(): object {
    return {
      w: 380,
      h: 56,
      rect: true,
      color: Colors.transparent,
      Background: {
        w: 380,
        h: 56,
        rect: true,
        color: Colors.searchBarBackground,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 28 },
      },
      FocusIndicator: {
        w: 380,
        h: 56,
        rect: true,
        color: Colors.transparent,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 28 },
        alpha: 0,
      },
      SearchIcon: {
        x: 24,
        y: 28,
        mount: 0.5,
        w: 24,
        h: 24,
        src: "assets/icons/search-icon-white.svg",
      },
      SearchLabel: {
        x: 60,
        y: 10,
        text: {
          text: "Search stocks...",
          fontSize: FontSize.Body,
          fontStyle: FontStyle.Bold,
          textColor: Colors.textPrimary,
          fontFace: FontFamily.Default,
        },
      },
      Cursor: {
        x: 60,
        y: 10,
        text: {
          text: "|",
          fontSize: FontSize.Body,
          fontStyle: FontStyle.Bold,
          textColor: Colors.textPrimary,
          fontFace: FontFamily.Default,
        },
        alpha: 0,
      },
    };
  }

  _init(): void {
    // Component initialized
  }
  _detach(): void {
    this._stopCursorBlink();
  }

  _focus(): void {
    this.isFocused = true;
    const focusIndicator = this.tag("FocusIndicator");
    if (focusIndicator) {
      focusIndicator.setSmooth("alpha", 1, { duration: 0.2 });
      focusIndicator.setSmooth("color", Colors.focusIndicator, {
        duration: 0.2,
      });
    }

    if (this.searchQuery.length === 0) {
      this._showCursor();
      this._startCursorBlink();
      const searchLabel = this.tag("SearchLabel");
      if (searchLabel) {
        searchLabel.setSmooth("alpha", 0, { duration: 0.2 });
      }
    }
  }

  _unfocus(): void {
    this.isFocused = false;
    const focusIndicator = this.tag("FocusIndicator");
    if (focusIndicator) {
      focusIndicator.setSmooth("alpha", 0, { duration: 0.2 });
    }

    if (this.searchQuery.length === 0) {
      this._hideCursor();
      this._stopCursorBlink();
      const searchLabel = this.tag("SearchLabel");
      if (searchLabel) {
        searchLabel.setSmooth("alpha", 1, { duration: 0.2 });
      }
    }
  }

  _handleEnter(): boolean {
    // Open full-screen search experience

    this.fireAncestors("$openSearch");
    return true;
  }

  _handleKey(event: KeyboardEvent): boolean {
    const key = event.key;

    if (this.searchQuery.length >= 0) {
      if (key === "Backspace") {
        if (this.searchQuery.length > 0) {
          this.searchQuery = this.searchQuery.slice(0, -1);
          this._updateSearchText();
          this._debouncedSearch();
        } else {
          this._deactivateSearch();
        }
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

  _handleUp(): boolean {
    if (this.searchResults.length > 0) {
      const event: INavigateSearchResultsEvent = {
        currentIndex: this.selectedSearchIndex,
      };
      this.fireAncestors("$navigateSearchResultsUp", event);
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.searchResults.length > 0) {
      const event: INavigateSearchResultsEvent = {
        currentIndex: this.selectedSearchIndex,
      };
      this.fireAncestors("$navigateSearchResultsDown", event);
      return true;
    }
    return false;
  }

  _getFocused(): Lightning.Component {
    return this;
  }

  private _activateSearch(): void {
    this.searchQuery = "";
    this.searchResults = [];
    this.selectedSearchIndex = 0;

    const searchLabel = this.tag("SearchLabel");
    if (searchLabel && searchLabel.text) {
      searchLabel.text.text = "|";
      searchLabel.text.textColor = Colors.textPrimary;
      searchLabel.text.fontSize = FontSize.Body;
      searchLabel.text.fontStyle = FontStyle.Bold;
      searchLabel.setSmooth("alpha", 1, { duration: 0.2 });
    }

    this._hideCursor();
    this._stopCursorBlink();

    const event: ISearchActivatedEvent = { component: this };
    this.fireAncestors("$searchActivated", event);
  }

  private _deactivateSearch(): void {
    this.searchQuery = "";
    this._clearSearchResults();

    const searchLabel = this.tag("SearchLabel");
    if (searchLabel && searchLabel.text) {
      searchLabel.text.text = "Search stocks...";
      searchLabel.text.textColor = Colors.textPrimary;
      searchLabel.text.fontSize = FontSize.Body;
      searchLabel.text.fontStyle = FontStyle.Bold;
    }

    if (this.isFocused) {
      this._showCursor();
      this._startCursorBlink();
      if (searchLabel) {
        searchLabel.setSmooth("alpha", 0, { duration: 0.2 });
      }
    } else {
      this._hideCursor();
      this._stopCursorBlink();
      if (searchLabel) {
        searchLabel.setSmooth("alpha", 1, { duration: 0.2 });
      }
    }

    const event: ISearchDeactivatedEvent = { component: this };
    this.fireAncestors("$searchDeactivated", event);
  }

  private _updateSearchText(): void {
    const searchLabel = this.tag("SearchLabel");
    if (!searchLabel || !searchLabel.text) return;

    const displayText =
      this.searchQuery.length > 0 ? `${this.searchQuery}|` : "|";

    searchLabel.text.text = displayText;
    searchLabel.text.textColor = Colors.textPrimary;
    searchLabel.text.fontSize = FontSize.Body;
    searchLabel.text.fontStyle = FontStyle.Bold;
    searchLabel.setSmooth("alpha", 1, { duration: 0.1 });

    if (this.searchQuery.length > 0) {
      this._hideCursor();
      this._stopCursorBlink();
    }

    this.stage.update();
  }

  private _debouncedSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (this.searchQuery.length < 1) {
      this._clearSearchResults();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this._performSearch();
    }, 500);
  }

  private async _performSearch(): Promise<void> {
    if (!this.searchQuery || this.searchQuery.length < 1) return;

    try {
      const results = await stocksApi.searchStocks(this.searchQuery);
      const rankedResults = this._rankSearchResults(results, this.searchQuery);
      this.searchResults = rankedResults;
      this.selectedSearchIndex = 0;

      this._showSearchResults();
    } catch (error) {
      this.searchResults = [];
    }
  }

  private _rankSearchResults(
    results: ISearchResult[],
    query: string,
  ): ISearchResult[] {
    const queryUpper = query.toUpperCase();

    const scored = results.map((result) => {
      const symbol = (result.symbol || "").toUpperCase();
      const name = (result.name || "").toUpperCase();
      let score = 0;

      if (symbol === queryUpper) {
        score += 1000;
      } else if (symbol.startsWith(queryUpper)) {
        score += 500;
        score += Math.max(0, 10 - symbol.length);
      } else if (symbol.includes(queryUpper)) {
        score += 100;
        const position = symbol.indexOf(queryUpper);
        score += Math.max(0, 10 - position);
      }

      if (name.includes(queryUpper)) {
        score += 50;
        if (name.startsWith(queryUpper)) {
          score += 25;
        }
      }

      if (symbol.length > 6) {
        score -= 5;
      }

      return Object.assign({}, result, { _score: score });
    });

    scored.sort((a, b) => (b._score || 0) - (a._score || 0));
    return scored;
  }

  private _showSearchResults(): void {
    const event: IShowSearchResultsEvent = {
      results: this.searchResults,
      selectedIndex: this.selectedSearchIndex,
    };
    this.fireAncestors("$showSearchResults", event);
  }

  setSelectedIndex(index: number): void {
    if (index >= 0 && index < this.searchResults.length) {
      this.selectedSearchIndex = index;
      const event: IUpdateSearchSelectionEvent = {
        selectedIndex: this.selectedSearchIndex,
      };
      this.fireAncestors("$updateSearchSelection", event);
    }
  }

  private _clearSearchResults(): void {
    const event: IClearSearchResultsEvent = {};
    this.fireAncestors("$clearSearchResults", event);
  }

  getSearchQuery(): string {
    return this.searchQuery;
  }

  getSearchResults(): ISearchResult[] {
    return this.searchResults;
  }

  getSelectedSearchIndex(): number {
    return this.selectedSearchIndex;
  }

  isSearchActive(): boolean {
    return this.searchQuery.length > 0;
  }

  private _startCursorBlink(): void {
    this._stopCursorBlink();

    this.cursorVisible = true;
    this.cursorBlinkInterval = setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
      const cursor = this.tag("Cursor");
      if (cursor) {
        cursor.setSmooth("alpha", this.cursorVisible ? 1 : 0, {
          duration: 0.1,
        });
      }
    }, 500);
  }

  private _stopCursorBlink(): void {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = undefined;
    }
  }

  private _showCursor(): void {
    const cursor = this.tag("Cursor");
    if (cursor) {
      cursor.setSmooth("alpha", 1, { duration: 0.2 });
    }
  }

  private _hideCursor(): void {
    const cursor = this.tag("Cursor");
    if (cursor) {
      cursor.setSmooth("alpha", 0, { duration: 0.2 });
    }
  }
}
