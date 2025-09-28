import { Lightning } from "@lightningjs/sdk";

export interface TimePeriod {
  id: string;
  label: string;
  days: number;
}

const TIME_PERIODS: TimePeriod[] = [
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "6M", label: "6M", days: 180 },
  { id: "1Y", label: "1Y", days: 365 },
];

export default class TimeSelector extends Lightning.Component {
  private selectedPeriod = "1W";
  private onPeriodChange?: (period: TimePeriod) => void;

  static _template() {
    return {
      w: 500,
      h: 50,
      Background: {
        w: (w: number) => w,
        h: (h: number) => h,
        rect: true,
        color: 0x11ffffff, // Galaxy themed background
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 25 },
      },
      ButtonsContainer: {
        x: 0,
        y: 0,
        w: 500,
        h: 50,
        flex: {
          direction: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
        },
        children: TIME_PERIODS.map((period, index) => ({
          ref: `Button_${period.id}`,
          type: TimeButton,
          flexItem: { flex: 1, marginLeft: 0, marginRight: 0 },
          period: period,
          selected: period.id === "1W", // Default selection
        })),
      },
    };
  }

  _init() {
    // Set initial selection
    this._updateSelection("1W");
  }

  _handleLeft() {
    const currentIndex = TIME_PERIODS.findIndex(
      (p) => p.id === this.selectedPeriod
    );
    if (currentIndex > 0) {
      this._selectPeriod(TIME_PERIODS[currentIndex - 1].id);
    }
    return true;
  }

  _handleRight() {
    const currentIndex = TIME_PERIODS.findIndex(
      (p) => p.id === this.selectedPeriod
    );
    if (currentIndex < TIME_PERIODS.length - 1) {
      this._selectPeriod(TIME_PERIODS[currentIndex + 1].id);
    }
    return true;
  }

  _handleEnter() {
    // Trigger selection change
    const period = TIME_PERIODS.find((p) => p.id === this.selectedPeriod);
    if (period && this.onPeriodChange) {
      this.onPeriodChange(period);
    }
    return true;
  }

  private _selectPeriod(periodId: string) {
    this.selectedPeriod = periodId;
    this._updateSelection(periodId);

    // Call callback
    const period = TIME_PERIODS.find((p) => p.id === periodId);
    if (period && this.onPeriodChange) {
      this.onPeriodChange(period);
    }
  }

  private _updateSelection(selectedId: string) {
    TIME_PERIODS.forEach((period) => {
      const button = this.tag(`Button_${period.id}`) as TimeButton;
      if (button) {
        button.selected = period.id === selectedId;
      }
    });
  }

  set onChange(callback: (period: TimePeriod) => void) {
    this.onPeriodChange = callback;
  }

  get selectedTimePeriod(): TimePeriod {
    return (
      TIME_PERIODS.find((p) => p.id === this.selectedPeriod) || TIME_PERIODS[1]
    );
  }

  _getFocused() {
    return this.tag(`Button_${this.selectedPeriod}`);
  }
}

class TimeButton extends Lightning.Component {
  private _selected = false;
  private _period: TimePeriod = { id: "1M", label: "1M", days: 30 };

  static _template() {
    return {
      w: 90,
      h: 40,
      Background: {
        w: (w: number) => w,
        h: (h: number) => h,
        rect: true,
        color: 0x00000000, // Transparent initially
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 20 },
      },
      Label: {
        x: 45,
        y: 20,
        mount: 0.5,
        text: {
          text: "1W",
          fontFace: "Arial",
          fontSize: 16,
          textColor: 0x88ffffff,
          fontWeight: 500,
        },
      },
    };
  }

  set period(p: TimePeriod) {
    this._period = p;
    this.tag("Label")!.text.text = p.label;
  }

  get period() {
    return this._period;
  }

  set selected(isSelected: boolean) {
    this._selected = isSelected;
    this._updateAppearance();
  }

  get selected() {
    return this._selected;
  }

  private _updateAppearance() {
    const bg = this.tag("Background");
    const label = this.tag("Label");

    if (this._selected) {
      // Selected state - Galaxy teal gradient
      bg!.setSmooth("color", 0xff00d4ff, { duration: 0.4 });
      bg!.setSmooth("alpha", 1, { duration: 0.4 });
      label!.text.textColor = 0xff000000; // Black text on teal
    } else {
      // Unselected state - transparent
      bg!.setSmooth("color", 0x00000000, { duration: 0.4 });
      bg!.setSmooth("alpha", 0, { duration: 0.4 });
      label!.text.textColor = 0x88ffffff; // Semi-transparent white
    }
  }

  _focus() {
    if (!this._selected) {
      const bg = this.tag("Background");
      bg!.setSmooth("alpha", 0.1, { duration: 0.2 });
    }
  }

  _unfocus() {
    if (!this._selected) {
      const bg = this.tag("Background");
      bg!.setSmooth("alpha", 0, { duration: 0.2 });
    }
  }

  _handleEnter() {
    // Let parent handle the selection
    return false;
  }
}
