/**
 * Base Auth Screen
 * Shared logic for Sign In and Sign Up screens
 */

import { Lightning } from "@lightningjs/sdk";
import BaseScreen from "../BaseScreen";
import { Colors } from "../../constants/Colors";
import { FontSize, FontStyle, FontFamily } from "../../constants/Fonts";

type TabType = "mobile" | "email";

interface IAuthTabContent extends Lightning.Component {
  _captureKey?: (event: KeyboardEvent) => boolean;
  _handleKey?: (event: KeyboardEvent) => boolean;
  _clearAllFocus?: () => void;
}

interface IAuthConfig {
  title: string;
  subtitle: string;
  mobileTabLabel: string;
  emailTabLabel: string;
  mobileTabWidth: number;
  emailTabX: number;
  emailTabWidth: number;
}

export default abstract class BaseAuthScreen extends BaseScreen {
  protected currentTab: TabType = "mobile";
  protected focusOnTab: boolean = true;

  protected abstract getAuthConfig(): IAuthConfig;
  protected abstract getMobileContentComponent(): Lightning.Component.Constructor;
  protected abstract getEmailContentComponent(): Lightning.Component.Constructor;

  static _template(): object {
    return {
      w: 1920,
      h: 1080,
      rect: true,
      color: Colors.authBackground,

      Header: {
        x: 120,
        y: 80,
        w: 1680,

        Title: {
          y: 0,
          text: {
            text: "",
            fontSize: 72,
            fontStyle: FontStyle.Bold,
            textColor: Colors.textPrimary,
            fontFace: FontFamily.Default,
          },
        },

        Subtitle: {
          y: 100,
          text: {
            text: "",
            fontSize: FontSize.Large,
            textColor: Colors.textTertiary,
            fontFace: FontFamily.Default,
          },
        },
      },

      TabBar: {
        x: 120,
        y: 260,
        w: 1680,
        h: 60,

        TabUnderline: {
          x: 0,
          y: 58,
          w: 1680,
          h: 2,
          rect: true,
          color: Colors.authBorderLight,
        },

        MobileTab: {
          x: 0,
          y: 0,

          Label: {
            x: 0,
            y: 20,
            text: {
              text: "",
              fontSize: FontSize.Large,
              textColor: Colors.authAccent,
              fontFace: FontFamily.Default,
            },
          },

          Indicator: {
            x: 0,
            y: 58,
            w: 280,
            h: 3,
            rect: true,
            color: Colors.authAccent,
          },
        },

        EmailTab: {
          x: 350,
          y: 0,

          Label: {
            x: 0,
            y: 20,
            text: {
              text: "",
              fontSize: FontSize.Large,
              textColor: Colors.textTertiary,
              fontFace: FontFamily.Default,
            },
          },

          Indicator: {
            x: 0,
            y: 58,
            w: 260,
            h: 3,
            rect: true,
            color: Colors.transparent,
            alpha: 0,
          },
        },
      },

      TabContent: {
        x: 120,
        y: 360,
        w: 1680,
        h: 640,

        MobileContent: {
          alpha: 1,
        },

        EmailContent: {
          alpha: 0,
        },
      },
    };
  }

  _init(): void {
    const config = this.getAuthConfig();
    
    const header = this.tag("Header");
    if (header) {
      const title = header.tag("Title");
      if (title && title.text) {
        title.text.text = config.title;
      }

      const subtitle = header.tag("Subtitle");
      if (subtitle && subtitle.text) {
        subtitle.text.text = config.subtitle;
      }
    }

    const tabBar = this.tag("TabBar");
    if (tabBar) {
      const mobileTab = tabBar.tag("MobileTab");
      if (mobileTab) {
        const label = mobileTab.tag("Label");
        if (label && label.text) {
          label.text.text = config.mobileTabLabel;
        }
        const indicator = mobileTab.tag("Indicator");
        if (indicator) {
          indicator.w = config.mobileTabWidth;
        }
      }

      const emailTab = tabBar.tag("EmailTab");
      if (emailTab) {
        emailTab.x = config.emailTabX;
        const label = emailTab.tag("Label");
        if (label && label.text) {
          label.text.text = config.emailTabLabel;
        }
        const indicator = emailTab.tag("Indicator");
        if (indicator) {
          indicator.w = config.emailTabWidth;
        }
      }
    }

    const tabContent = this.tag("TabContent");
    if (tabContent) {
      tabContent.patch({
        MobileContent: {
          type: this.getMobileContentComponent(),
          authType: "signup",
        },
        EmailContent: {
          type: this.getEmailContentComponent(),
        },
      });
    }
  }

  _active(): void {
    this.currentTab = "mobile";
    this.focusOnTab = true;
    this._updateTabFocusIndicator();
    this._updateTabContent();
  }

  _handleLeft(): boolean {
    if (this.focusOnTab && this.currentTab === "email") {
      this.currentTab = "mobile";
      this._updateTabFocusIndicator();
      this._updateTabContent();
      this.stage.update();
      return true;
    }
    return false;
  }

  _handleRight(): boolean {
    if (this.focusOnTab && this.currentTab === "mobile") {
      this.currentTab = "email";
      this._updateTabFocusIndicator();
      this._updateTabContent();
      this.stage.update();
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.focusOnTab) {
      this.focusOnTab = false;
      this._updateTabFocusIndicator();
      this.stage.update();
      return true;
    }
    return false;
  }

  _captureKey(event: KeyboardEvent): boolean {
    if (!this.focusOnTab) {
      const activeContent = this._getActiveContent();
      if (activeContent?._captureKey) {
        return activeContent._captureKey(event);
      }
    }
    return false;
  }

  _handleKey(event: KeyboardEvent): boolean {
    if (!this.focusOnTab) {
      const activeContent = this._getActiveContent();
      if (activeContent?._handleKey) {
        return activeContent._handleKey(event);
      }
    }
    return false;
  }

  $focusBackToTab(): void {
    this.focusOnTab = true;
    this._clearFieldFocus();
    this._updateTabFocusIndicator();
    this.stage.update();
  }

  private _clearFieldFocus(): void {
    const activeContent = this._getActiveContent();
    if (activeContent?._clearAllFocus) {
      activeContent._clearAllFocus();
    }
  }

  private _getActiveContent(): IAuthTabContent | null {
    const tabContent = this.tag("TabContent");
    if (!tabContent) return null;

    return (
      this.currentTab === "mobile"
        ? tabContent.tag("MobileContent")
        : tabContent.tag("EmailContent")
    ) as IAuthTabContent | null;
  }

  private _updateTabFocusIndicator(): void {
    const tabBar = this.tag("TabBar");
    if (!tabBar) return;

    this._updateSingleTabFocus(tabBar.tag("MobileTab"), "mobile");
    this._updateSingleTabFocus(tabBar.tag("EmailTab"), "email");

    this.stage.update();
  }

  private _updateSingleTabFocus(
    tab: Lightning.Component | undefined,
    tabType: TabType
  ): void {
    if (!tab) return;

    const label = tab.tag("Label");
    const indicator = tab.tag("Indicator");

    if (label && label.text) {
      const isActive = this.currentTab === tabType;
      label.text.textColor = isActive
        ? this.focusOnTab
          ? Colors.white
          : Colors.textQuaternary
        : Colors.textTertiary;
    }

    if (indicator) {
      indicator.setSmooth("alpha", this.currentTab === tabType ? 1 : 0, {
        duration: 0.2,
      });
    }
  }

  private _updateTabContent(): void {
    const tabContent = this.tag("TabContent");
    if (!tabContent) return;

    const mobileContent = tabContent.tag("MobileContent");
    const emailContent = tabContent.tag("EmailContent");

    if (mobileContent) {
      mobileContent.setSmooth("alpha", this.currentTab === "mobile" ? 1 : 0, {
        duration: 0.3,
      });
    }

    if (emailContent) {
      emailContent.setSmooth("alpha", this.currentTab === "email" ? 1 : 0, {
        duration: 0.3,
      });
    }

    this.stage.update();
  }

  _getFocused(): Lightning.Component {
    if (!this.focusOnTab) {
      const activeContent = this._getActiveContent();
      if (activeContent) {
        return activeContent;
      }
    }
    return this;
  }
}
