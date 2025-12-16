/**
 * On-Screen Keyboard Component
 * Linear keyboard layout for TV navigation
 */

import { Lightning } from "@lightningjs/sdk";
import { Colors } from "../constants/Colors";

type KeyboardMode = "abc" | "ABC";

export default class Keyboard extends Lightning.Component {
  private selectedRow: number = 0; // 0 = main row, 1 = second row, 2 = mode toggles, 3 = done
  private selectedCol: number = 1; // Start at 'a' (after SPACE)
  private mode: KeyboardMode = "abc";

  private layouts = {
    abc: [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ],
    ABC: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ],
  };

  private secondRowKeys = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    ".",
    "_",
    "-",
    "@",
    ".com",
    ".net",
  ];

  static _template(): Lightning.Component.Template {
    return {
      w: 1880,
      h: 550,
      visible: true,
      alpha: 1,

      // Main keys row container
      KeysRow: {
        x: 0,
        y: 0,
        w: 1880,
        h: 90,
      },

      // Second row: numbers and special chars
      SecondRow: {
        x: 0,
        y: 110,
        w: 1880,
        h: 90,
      },

      // Mode toggles (ABC / abc)
      ModeToggles: {
        x: 0,
        y: 230,
        w: 1880,
        h: 80,
      },

      // Done button at bottom (centered)
      DoneButton: {
        x: (1880 - 240) / 2, // Center 240px button in 1880px container
        y: 350,
        w: 240,
        h: 80,
        rect: true,
        color: 0x00000000,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },

        Label: {
          x: 120,
          y: 40,
          mount: 0.5,
          text: {
            text: "Done",
            fontSize: 34,
            fontStyle: "bold",
            textColor: 0xffffffff,
          },
        },
      },
    };
  }

  _init(): void {
    this._createKeys();
    this._createModeToggles();
  }

  private _createKeys(): void {
    const keysRow = this.tag("KeysRow") as any;
    const secondRow = this.tag("SecondRow") as any;
    if (!keysRow || !secondRow) return;

    const keySize = 56;
    const spacing = 6;
    const spaceWidth = 150;
    const deleteWidth = 90;
    const sectionGap = 8;

    // Calculate centering offset for first row
    // Total width: SPACE(150) + gap(8) + 26keys(26*56 + 25*6=1606) + gap(8) + DELETE(90) = 1862
    const totalFirstRowWidth =
      spaceWidth +
      sectionGap +
      (26 * keySize + 25 * spacing) +
      sectionGap +
      deleteWidth;
    const firstRowOffset = (1880 - totalFirstRowWidth) / 2; // Center the entire row

    // Create SPACE button (left side) - Column 0
    const isSpaceFocused = this.selectedRow === 0 && this.selectedCol === 0;
    keysRow.patch({
      SpaceKey: {
        x: firstRowOffset,
        y: 0,
        w: spaceWidth,
        h: keySize,
        rect: true,
        color: isSpaceFocused ? 0xffffffff : 0x35ffffff,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
        Label: {
          x: spaceWidth / 2,
          y: keySize / 2,
          mount: 0.5,
          text: {
            text: "SPACE",
            fontSize: 22,
            fontStyle: "bold",
            textColor: isSpaceFocused ? 0xff000000 : 0xffffffff,
          },
        },
      },
    });

    // Create main alphabet keys (a-z) - Columns 1-26
    const currentLayout = this.layouts[this.mode];
    const mainKeys = currentLayout.slice(0, 26);
    let startX = firstRowOffset + spaceWidth + sectionGap;

    mainKeys.forEach((key, index) => {
      const keyTag = `Key_${index}`;
      const isSelected =
        this.selectedRow === 0 && this.selectedCol === index + 1;

      keysRow.patch({
        [keyTag]: {
          x: startX + index * (keySize + spacing),
          y: 0,
          w: keySize,
          h: keySize,
          rect: true,
          color: isSelected ? 0xffffffff : 0x35ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
          Label: {
            x: keySize / 2,
            y: keySize / 2,
            mount: 0.5,
            text: {
              text: key,
              fontSize: 32,
              fontStyle: "bold",
              textColor: isSelected ? 0xff000000 : 0xffffffff,
            },
          },
        },
      });
    });

    // Create DELETE button (right side) - Column 27
    const isDeleteFocused = this.selectedRow === 0 && this.selectedCol === 27;
    const deleteX = startX + (26 * keySize + 25 * spacing) + sectionGap;
    keysRow.patch({
      DeleteKey: {
        x: deleteX,
        y: 0,
        w: deleteWidth,
        h: keySize,
        rect: true,
        color: isDeleteFocused ? 0xffffffff : 0x35ffffff,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
        Label: {
          x: deleteWidth / 2,
          y: keySize / 2,
          mount: 0.5,
          text: {
            text: "⌫",
            fontSize: 32,
            fontStyle: "bold",
            textColor: isDeleteFocused ? 0xff000000 : 0xffffffff,
          },
        },
      },
    });

    // Create second row: numbers and special characters
    // Calculate total width: 10 single chars (56px) + 6 special chars (4*56px + 2*85px) + spacing
    const specialKeyWidth = 85;
    const totalSecondRowWidth =
      10 * keySize + // 10 number keys
      4 * keySize + // 4 single special chars (. _ - @)
      2 * specialKeyWidth + // 2 domain keys (.com .net)
      15 * spacing; // 15 gaps between 16 keys
    const secondRowOffset = (1880 - totalSecondRowWidth) / 2;

    let secondRowX = secondRowOffset;
    this.secondRowKeys.forEach((key, index) => {
      const keyTag = `SecondKey_${index}`;
      const keyWidth = key.length > 2 ? specialKeyWidth : keySize;
      const isSelected = this.selectedRow === 1 && this.selectedCol === index;

      secondRow.patch({
        [keyTag]: {
          x: secondRowX,
          y: 0,
          w: keyWidth,
          h: keySize,
          rect: true,
          color: isSelected ? 0xffffffff : 0x35ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
          Label: {
            x: keyWidth / 2,
            y: keySize / 2,
            mount: 0.5,
            text: {
              text: key,
              fontSize: key.length > 2 ? 22 : 32,
              fontStyle: "bold",
              textColor: isSelected ? 0xff000000 : 0xffffffff,
            },
          },
        },
      });

      secondRowX += keyWidth + spacing;
    });

    this.stage.update();
  }

  private _createModeToggles(): void {
    const container = this.tag("ModeToggles") as any;
    const doneButton = this.tag("DoneButton") as any;
    if (!container || !doneButton) return;

    const modes = [
      { key: "ABC", label: "ABC" },
      { key: "abc", label: "abc" },
    ];

    // Center mode toggles: 2 buttons (140px each) + gap (12px) = 292px total
    const modeButtonWidth = 140;
    const modeGap = 12;
    const totalModeWidth = 2 * modeButtonWidth + modeGap;
    const modeStartX = (1880 - totalModeWidth) / 2;

    modes.forEach((modeItem, index) => {
      const isActive = this.mode === modeItem.key;
      const isFocused = this.selectedRow === 2 && this.selectedCol === index;

      container.patch({
        [`Mode_${index}`]: {
          x: modeStartX + index * (modeButtonWidth + modeGap),
          y: 0,
          w: modeButtonWidth,
          h: 65,
          rect: true,
          color: isFocused ? 0xffffffff : isActive ? 0x50ffffff : 0x30ffffff,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 12 },
          Label: {
            x: modeButtonWidth / 2,
            y: 32.5,
            mount: 0.5,
            text: {
              text: modeItem.label,
              fontSize: 28,
              fontStyle: "bold",
              textColor: isFocused
                ? 0xff000000
                : isActive
                ? 0xffffffff
                : 0xc0ffffff,
            },
          },
        },
      });
    });

    // Update Done button focus (subtle green color)
    const isDoneFocused = this.selectedRow === 3;
    doneButton.patch({
      color: isDoneFocused ? 0xffffffff : 0xff16a34a,
      shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
    });

    const doneLabel = doneButton.tag("Label");
    if (doneLabel && doneLabel.text) {
      doneLabel.text.textColor = isDoneFocused ? 0xff16a34a : 0xffffffff;
    }

    this.stage.update();
  }

  private _updateKeyFocus(): void {
    this._createKeys();
    this._createModeToggles();
  }

  _handleUp(): boolean {
    if (this.selectedRow > 0) {
      this.selectedRow--;

      // Adjust column for row boundaries
      if (this.selectedRow === 0) {
        // Moving to main row (0-27)
        if (this.selectedCol > 27) this.selectedCol = 27;
      } else if (this.selectedRow === 1) {
        // Moving to second row (0-15)
        if (this.selectedCol > 15) this.selectedCol = 15;
      } else if (this.selectedRow === 2) {
        // Moving to mode toggles (0-1)
        this.selectedCol = Math.min(this.selectedCol, 1);
      }

      this._updateKeyFocus();
      return true;
    }
    return false;
  }

  _handleDown(): boolean {
    if (this.selectedRow < 3) {
      this.selectedRow++;

      // Adjust column for row boundaries
      if (this.selectedRow === 1) {
        // Moving to second row (0-15)
        if (this.selectedCol > 15) this.selectedCol = 8; // Center of second row
      } else if (this.selectedRow === 2) {
        // Moving to mode toggles (0-1)
        this.selectedCol = this.mode === "ABC" ? 0 : 1; // Default to current mode
      } else if (this.selectedRow === 3) {
        // Moving to done button
        this.selectedCol = 0;
      }

      this._updateKeyFocus();
      return true;
    }
    return false;
  }

  _handleLeft(): boolean {
    // Wrap around to end of row when at start
    if (this.selectedCol === 0) {
      let maxCol = 0;
      
      if (this.selectedRow === 0) {
        maxCol = 27; // SPACE + 26 letters + DELETE
      } else if (this.selectedRow === 1) {
        maxCol = 15; // 16 keys in second row
      } else if (this.selectedRow === 2) {
        maxCol = 1; // 2 mode toggles
      } else if (this.selectedRow === 3) {
        maxCol = 0; // Done button (no wrap needed)
        return false;
      }
      
      this.selectedCol = maxCol;
      this._updateKeyFocus();
      return true;
    }
    
    this.selectedCol--;
    this._updateKeyFocus();
    return true;
  }

  _handleRight(): boolean {
    let maxCol = 0;

    if (this.selectedRow === 0) {
      maxCol = 27; // SPACE + 26 letters + DELETE
    } else if (this.selectedRow === 1) {
      maxCol = 15; // 16 keys in second row
    } else if (this.selectedRow === 2) {
      maxCol = 1; // 2 mode toggles
    } else if (this.selectedRow === 3) {
      maxCol = 0; // Done button (no wrap needed)
      return false;
    }

    // Wrap around to start of row when at end
    if (this.selectedCol >= maxCol) {
      this.selectedCol = 0;
      this._updateKeyFocus();
      return true;
    }

    this.selectedCol++;
    this._updateKeyFocus();
    return true;
  }

  _handleEnter(): boolean {
    // Row 0: Main keyboard row
    if (this.selectedRow === 0) {
      if (this.selectedCol === 0) {
        // SPACE button
        this.fireAncestors("$onKeyPress", { key: " " });
      } else if (this.selectedCol === 27) {
        // DELETE button
        this.fireAncestors("$onKeyPress", { key: "Delete" });
      } else {
        // Letter keys (1-26)
        const currentLayout = this.layouts[this.mode];
        const key = currentLayout[this.selectedCol - 1];
        if (key) {
          this.fireAncestors("$onKeyPress", { key });
        }
      }
    }
    // Row 1: Second row (numbers and special chars)
    else if (this.selectedRow === 1) {
      const key = this.secondRowKeys[this.selectedCol];
      if (key) {
        this.fireAncestors("$onKeyPress", { key });
      }
    }
    // Row 2: Mode toggles
    else if (this.selectedRow === 2) {
      const modes: KeyboardMode[] = ["ABC", "abc"];
      this.mode = modes[this.selectedCol];
      this.selectedRow = 0;
      this.selectedCol = 1;
      this._createKeys();
      this._createModeToggles();
    }
    // Row 3: Done button
    else if (this.selectedRow === 3) {
      this.fireAncestors("$onKeyPress", { key: "Done" });
    }

    return true;
  }

  _handleBack(): boolean {
    this.fireAncestors("$closeKeyboard");
    return true;
  }

  // Handle special keys with remote color buttons
  _handleRed(): boolean {
    // Delete key
    this.fireAncestors("$onKeyPress", { key: "Delete" });
    return true;
  }

  _handleGreen(): boolean {
    // Toggle between modes: abc -> ABC -> abc
    if (this.mode === "abc") {
      this.mode = "ABC";
    } else {
      this.mode = "abc";
    }
    this.selectedRow = 0;
    this.selectedCol = 1;
    this._createKeys();
    this._createModeToggles();
    return true;
  }

  _handleYellow(): boolean {
    // Space key
    this.fireAncestors("$onKeyPress", { key: " " });
    return true;
  }

  _handleBlue(): boolean {
    // Done key
    this.fireAncestors("$onKeyPress", { key: "Done" });
    return true;
  }
}
