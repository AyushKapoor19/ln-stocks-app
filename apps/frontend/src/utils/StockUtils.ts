/**
 * Stock Utilities Class
 *
 * Centralized utilities for stock data formatting and market status
 */

export class StockUtils {
  /**
   * Formats volume with K, M, B suffixes
   * @param volume - Volume number to format
   * @returns Formatted string (e.g., "2.5M", "1.2B")
   */
  static formatVolume(volume: number): string {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  /**
   * Formats market capitalization with T, B, M suffixes
   * @param marketCap - Market cap number to format
   * @returns Formatted string with $ prefix (e.g., "$523B", "$1.2T")
   */
  static formatMarketCap(marketCap: number): string {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(0)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(0)}M`;
    }
    return `$${marketCap.toString()}`;
  }

  /**
   * Formats a percentage
   * @param value - Percentage as decimal (e.g., 0.05 for 5%)
   * @param includeSign - Whether to include + sign for positive values
   * @returns Formatted string (e.g., "+5.00%", "-2.50%")
   */
  static formatPercentage(value: number, includeSign = true): string {
    const pct = (value * 100).toFixed(2);
    if (includeSign && value >= 0) {
      return `+${pct}%`;
    }
    return `${pct}%`;
  }

  /**
   * Checks if the stock market is currently open
   * Market hours: Monday-Friday, 9:30 AM - 4:00 PM EST
   * @returns Object with market status information
   */
  static getMarketStatus(): {
    isOpen: boolean;
    statusText: string;
    statusColor: number;
  } {
    const now = new Date();

    // Convert to EST time
    const estTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const currentHour = estTime.getHours();
    const currentMinutes = estTime.getMinutes();
    const currentDay = estTime.getDay();

    // Market hours: Monday-Friday, 9:30 AM - 4:00 PM EST
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const afterOpen =
      currentHour > 9 || (currentHour === 9 && currentMinutes >= 30);
    const beforeClose = currentHour < 16;
    const isOpen = isWeekday && afterOpen && beforeClose;

    return {
      isOpen,
      statusText: isOpen ? "Market Open" : "Market Closed",
      statusColor: isOpen ? 0xff00ff88 : 0xffff4444, // green : red
    };
  }

  /**
   * Gets the dynamic separator position based on market status
   * @param isOpen - Whether market is open
   * @returns Object with separator and time text x positions
   */
  static getMarketStatusLayout(isOpen: boolean): {
    separatorX: number;
    timeTextX: number;
  } {
    // With pill badge (12px) + "Market Open" ≈ 122px, "Market Closed" ≈ 145px at 20px font
    return {
      separatorX: isOpen ? 155 : 175,
      timeTextX: isOpen ? 172 : 192,
    };
  }

  /**
   * Gets market hours display text
   * @returns Market hours string
   */
  static getMarketHoursText(): string {
    return "9:30 AM - 4:00 PM EST";
  }

  /**
   * Checks if a given date is a trading day (Monday-Friday)
   * @param date - Date to check (defaults to today)
   * @returns true if it's a weekday
   */
  static isTradingDay(date: Date = new Date()): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday = 1, Friday = 5
  }

  /**
   * Gets next market open time
   * @returns Date object of next market open (9:30 AM EST)
   */
  static getNextMarketOpen(): Date {
    const now = new Date();
    const estTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );

    const nextOpen = new Date(estTime);
    nextOpen.setHours(9, 30, 0, 0);

    // If it's after 4 PM or weekend, move to next day
    if (
      estTime.getHours() >= 16 ||
      estTime.getDay() === 0 ||
      estTime.getDay() === 6
    ) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }

    // Skip weekends
    while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }

    return nextOpen;
  }
}
