import { Lightning } from "@lightningjs/sdk";
import BaseComponent from "./BaseComponent";
import { Colors } from "../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../constants/Fonts";
import { ISearchResult } from "../types/events";

/**
 * SearchResults Component
 *
 * All dimensions are defined in 1080p coordinates.
 * Lightning.js automatically scales based on actual device resolution.
 */
export default class SearchResults extends BaseComponent {
  private results: ISearchResult[] = [];
  private selectedIndex = 0;
  private itemHeight = 58;
  private visibleHeight = this.itemHeight * 2;

  static _template(): object {
    return {
      w: 380,
      h: 260,
      rect: true,
      color: Colors.transparent,
      OuterShadow: {
        w: 390,
        h: 270,
        x: -5,
        y: -5,
        rect: true,
        color: Colors.shadow,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: [22, 22, 22, 22],
        },
      },
      Background: {
        w: 380,
        h: 260,
        rect: true,
        color: Colors.cardBackground,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: [18, 18, 18, 18],
        },
      },
      Border: {
        w: 380,
        h: 260,
        rect: true,
        color: Colors.border,
        shader: {
          type: Lightning.shaders.RoundedRectangle,
          radius: [18, 18, 18, 18],
        },
      },
      ScrollContainer: {
        x: 12,
        y: 12,
        w: 356,
        h: 236,
        clipping: true,
        rect: true,
        color: Colors.transparent,
        ResultsList: {
          y: 0,
          w: 356,
        },
      },
    };
  }

  _init(): void {
    // Component initialized
  }

  _handleUp(): boolean {
    if (this.results.length === 0) return false;

    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this._updateSelection();
      this._scrollToSelected();
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.results.length === 0) return false;

    if (this.selectedIndex < this.results.length - 1) {
      this.selectedIndex++;
      this._updateSelection();
      this._scrollToSelected();
      return true;
    }
    return false;
  }

  _getFocused(): Lightning.Component {
    return this;
  }

  setResults(results: ISearchResult[]): void {
    this.results = results || [];
    this.selectedIndex = 0;
    this._renderResults();
  }

  setSelectedIndex(index: number): void {
    if (index >= 0 && index < this.results.length) {
      this.selectedIndex = index;
      this._updateSelection();
      this._scrollToSelected();
    }
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  getSelectedResult(): ISearchResult | null {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
      return this.results[this.selectedIndex];
    }
    return null;
  }

  getResults(): ISearchResult[] {
    return this.results;
  }

  clearResults(): void {
    this.results = [];
    this.selectedIndex = 0;
    const scrollContainer = this.tag("ScrollContainer");
    if (scrollContainer) {
      const resultsList = scrollContainer.tag("ResultsList");
    if (resultsList) {
      resultsList.children = [];
      }
    }
  }

  private _renderResults(): void {
    const scrollContainer = this.tag("ScrollContainer");
    if (!scrollContainer) return;
    const resultsList = scrollContainer.tag("ResultsList");
    if (!resultsList) return;
    resultsList.children = [];
    const totalHeight = this.results.length * this.itemHeight;
    resultsList.h = Math.max(totalHeight, this.visibleHeight);
    resultsList.y = 0;
    this.results.forEach((result, index) => {
      const isSelected = index === this.selectedIndex;
      resultsList.childList.add({
        ref: `Result_${index}`,
        y: index * this.itemHeight,
        w: 356,
        h: 56,
        rect: true,
        clipping: true,
        color: isSelected
          ? Colors.cardBackgroundSelected
          : Colors.cardBackground,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
        AccentBar: {
          x: 1,
          y: 1,
          w: 4,
          h: 54,
          rect: true,
          color: isSelected ? Colors.stockGreenBright : Colors.transparent,
          shader: {
            type: Lightning.shaders.RoundedRectangle,
            radius: [9, 0, 0, 9],
          },
        },
        Symbol: {
          x: 24,
          y: 14,
          text: {
            text: result.symbol,
            fontFace: FontFamily.Default,
            fontSize: FontSize.Small,
            fontStyle: FontStyle.ExtraBold,
            textColor: isSelected ? Colors.textPrimary : Colors.textSecondary,
            letterSpacing: 0.8,
          },
        },
        Name: {
          x: 24,
          y: 36,
          w: 300,
          text: {
            text:
              result.name.length > 38
                ? `${result.name.substring(0, 38)}...`
                : result.name,
            fontFace: FontFamily.Default,
            fontSize: FontSize.XSmall,
            textColor: isSelected ? Colors.textTertiary : Colors.textQuaternary,
            maxLines: 1,
            wordWrap: false,
          },
        },
        Arrow: {
          x: 330,
          y: 28,
          mount: 0.5,
          alpha: isSelected ? 1 : 0,
          text: {
            text: "→",
            fontSize: FontSize.Medium,
            textColor: Colors.stockGreenBright,
          },
        },
        Divider:
          index < this.results.length - 1
            ? {
                x: 16,
                y: 55,
                w: 324,
                h: 1,
                rect: true,
                color: Colors.separator,
              }
            : undefined,
      });
    });
    requestAnimationFrame(() => {
      this._scrollToSelected();
    });
  }

  private _updateSelection(): void {
    const scrollContainer = this.tag("ScrollContainer");
    if (!scrollContainer) return;
    const resultsList = scrollContainer.tag("ResultsList");
    if (!resultsList) return;

    this.results.forEach((result, index) => {
      const resultItem = resultsList.tag(`Result_${index}`);
      if (resultItem) {
        const isSelected = index === this.selectedIndex;

        resultItem.setSmooth(
          "color",
          isSelected ? Colors.cardBackgroundSelected : Colors.cardBackground,
          { duration: 0.15 }
        );

        const accent = resultItem.tag("AccentBar");
        if (accent) {
          accent.setSmooth(
            "color",
            isSelected ? Colors.stockGreenBright : Colors.transparent,
            { duration: 0.15 }
          );
        }

        const symbol = resultItem.tag("Symbol");
        if (symbol && symbol.text) {
          symbol.text.textColor = isSelected
            ? Colors.textPrimary
            : Colors.textSecondary;
        }

        const name = resultItem.tag("Name");
        if (name && name.text) {
          name.text.textColor = isSelected
            ? Colors.textTertiary
            : Colors.textQuaternary;
        }

        const arrow = resultItem.tag("Arrow");
        if (arrow) {
          arrow.setSmooth("alpha", isSelected ? 1 : 0, { duration: 0.15 });
        }
      }
    });

    this.stage.update();
  }

  private _scrollToSelected(): void {
    const scrollContainer = this.tag("ScrollContainer");
    if (!scrollContainer) return;
    const resultsList = scrollContainer.tag("ResultsList");
    if (!resultsList) return;

    if (this.results.length === 0) return;

    if (this.selectedIndex === 0) {
      const currentScrollY = resultsList.y || 0;
      if (currentScrollY !== 0) {
        resultsList.setSmooth("y", 0, { duration: 0.2 });
        this.stage.update();
      }
      return;
    }

    const selectedItemTop = this.selectedIndex * this.itemHeight;
    const selectedItemBottom = selectedItemTop + this.itemHeight;
    const currentScrollY = resultsList.y || 0;
    const viewportTop = -currentScrollY;
    const viewportBottom = viewportTop + this.visibleHeight;

    let newScrollY = currentScrollY;
    let needsScroll = false;

    if (selectedItemTop < viewportTop) {
      newScrollY = -selectedItemTop;
      needsScroll = true;
    } else if (selectedItemBottom > viewportBottom) {
      newScrollY = -(selectedItemBottom - this.visibleHeight);
      needsScroll = true;
    }

    const totalHeight = this.results.length * this.itemHeight;
    const maxScrollY = 0;
    const minScrollY = Math.min(0, -(totalHeight - this.visibleHeight));

    newScrollY = Math.max(minScrollY, Math.min(maxScrollY, newScrollY));

    if (needsScroll || Math.abs(newScrollY - currentScrollY) > 0.5) {
      resultsList.setSmooth("y", newScrollY, { duration: 0.2 });
      this.stage.update();
    } else if (Math.abs(newScrollY - currentScrollY) > 0.1) {
      resultsList.y = newScrollY;
      this.stage.update();
    }
  }
}
