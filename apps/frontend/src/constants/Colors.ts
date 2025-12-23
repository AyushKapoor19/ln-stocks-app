/**
 * Color Constants for Lightning Stocks App
 *
 * Colors are defined in Lightning.js format: 0xAARRGGBB
 * where AA = alpha, RR = red, GG = green, BB = blue
 *
 * All values are in hex format for Lightning.js compatibility.
 */
export const Colors = {
  // Base colors
  transparent: 0x00000000,
  black: 0xff000000,
  white: 0xffffffff,

  // Background colors
  background: 0xff0b0b0c, // Main app background
  cardBackground: 0xff18181b, // Card/panel background (#23232a)
  cardBackgroundFocus: 0xff27272a, // Focused card background
  cardBackgroundHover: 0xff202024, // Hover card background
  cardBackgroundSelected: 0xff2a2a2e, // Selected item background
  searchBarBackground: 0xee1a1a1a, // Search bar dark gray

  // Text colors
  textPrimary: 0xffffffff, // Primary white text
  textSecondary: 0xffeeeeee, // Slightly dimmed white
  textTertiary: 0xffb0b0b0, // Medium gray text
  textQuaternary: 0xff888888, // Darker gray text
  textDisabled: 0xff3f3f46, // Disabled state
  textUnfocused: 0xaaffffff, // Unfocused text (semi-transparent white)

  // Stock colors
  stockGreen: 0xff22c55e, // Positive change (defined color)
  stockGreenBright: 0xff00ff88, // Bright green for stock price/change
  stockRed: 0xffef4444, // Negative change
  stockGray: 0xff71717a, // No change

  // UI elements
  border: 0x44ffffff, // Border/outline
  separator: 0x22ffffff, // Divider lines
  shadow: 0x99000000, // Drop shadow
  focusIndicator: 0x33ffffff, // Focus ring/border

  // Button states
  buttonFocused: 0x44ffffff, // Focused button background
  buttonHover: 0x33ffffff, // Hover button background
  buttonUnfocused: 0x11ffffff, // Unfocused button background

  // Accent colors
  accent: 0xff2563eb, // Blue accent
  accentHover: 0xff3b82f6, // Lighter blue
  success: 0xff10b981, // Success green
  warning: 0xfff59e0b, // Warning yellow
  error: 0xffef4444, // Error red

  // Auth screen colors (mature green theme)
  authAccent: 0xff16a34a, // Mature green accent for auth screens
  authAccentHover: 0xff15803d, // Darker green on hover
  authAccentLight: 0xff22c55e, // Light green for highlights
  authBackground: 0xff000000, // Pure black background for auth
  authCardBackground: 0xff0f0f0f, // Slightly lighter black for cards
  authBorder: 0xff27272a, // Dark border
  authBorderLight: 0xff3f3f46, // Lighter border
  authInputBackground: 0xff18181b, // Input field background
  authOverlay: 0xdd000000, // Overlay with transparency

  // Profile/Account colors
  profileAccent: 0xff059669, // Deep teal-green for profile icons
} as const;

// Type for autocomplete support
export type ColorKey = keyof typeof Colors;
