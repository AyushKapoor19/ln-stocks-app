/**
 * Font Constants for Lightning Stocks App
 *
 * All font sizes are defined in 1080p coordinates (pixels).
 * Lightning.js automatically scales based on actual device resolution.
 */
export enum FontSize {
  // Extra sizes
  XXLarge = 84, // Main stock price
  XLarge = 50, // Stock symbol/name
  Large = 28, // Stock change, body text

  // Standard sizes
  TitleXL = 92,
  TitleL = 62,
  TitleM = 48,
  Title = 42,
  TitleS = 36,
  Body = 24,
  BodyL = 32,
  BodyS = 24,
  Button = 28,
  Label = 24,
  Caption = 22,
  Medium = 22, // Arrow and medium elements
  Small = 20, // Time buttons, small text
  XSmall = 13, // Company name in search results
  StockPrice = 48,
  StockChange = 28,
  StockSymbol = 50,
}

/**
 * Font Style Constants
 * Maps to CSS font-weight values and font-style
 */
export enum FontStyle {
  Thin = "100",
  Light = "300",
  Regular = "400",
  Medium = "500",
  SemiBold = "600",
  Bold = "700",
  ExtraBold = "800",
  Black = "900",
  Title = "bold",
  Body = "500",
  Caption = "normal",
}

/**
 * Line Height Constants (in pixels for 1080p)
 */
export enum LineHeight {
  Tight = 1.2,
  Normal = 1.5,
  Relaxed = 1.8,
  Loose = 2.0,
}

/**
 * Font Family Constants
 */
export enum FontFamily {
  Default = "Avenir Next",
  Title = "Avenir Next",
  Body = "Avenir Next",
  Monospace = "Courier New",
}
