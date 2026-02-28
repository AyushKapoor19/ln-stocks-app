/**
 * Color Constants
 */
export const Colors = {
  transparent: 0x00000000,
  black: 0xff000000,
  white: 0xffffffff,

  background: 0xff0b0b0c,
  cardBackground: 0xff18181b,
  cardBackgroundFocus: 0xff27272a,
  cardBackgroundHover: 0xff202024,
  cardBackgroundSelected: 0xff2a2a2e,
  searchBarBackground: 0xee1a1a1a,

  textPrimary: 0xffffffff,
  textSecondary: 0xffeeeeee,
  textTertiary: 0xffb0b0b0,
  textQuaternary: 0xff888888,
  textDisabled: 0xff3f3f46,
  textUnfocused: 0xaaffffff,

  stockGreen: 0xff22c55e,
  stockGreenBright: 0xff00ff88,
  stockRed: 0xffef4444,
  stockGray: 0xff71717a,

  border: 0x44ffffff,
  separator: 0x22ffffff,
  shadow: 0x99000000,
  focusIndicator: 0x33ffffff,

  buttonFocused: 0x44ffffff,
  buttonHover: 0x33ffffff,
  buttonUnfocused: 0x11ffffff,

  accent: 0xff2563eb,
  accentHover: 0xff3b82f6,
  success: 0xff10b981,
  warning: 0xfff59e0b,
  error: 0xffef4444,

  authAccent: 0xff16a34a,
  authAccentHover: 0xff15803d,
  authAccentLight: 0xff22c55e,
  authBackground: 0xff000000,
  authCardBackground: 0xff0f0f0f,
  authBorder: 0xff27272a,
  authBorderLight: 0xff3f3f46,
  authInputBackground: 0xff18181b,
  authOverlay: 0xdd000000,

  profileAccent: 0xff059669,

  buttonBackgroundFocused: 0xff666666,
  buttonBackgroundUnfocused: 0xff333333,
  buttonTextFocused: 0xffffffff,
  buttonTextUnfocused: 0xff999999,
  buttonTextLight: 0xffcccccc,

  dangerButtonFocused: 0xffff4444,
  dangerButtonUnfocused: 0xff992222,

  sectionTitleColor: 0xff666666,

  keyboardOverlayTop: 0xf8001a0d,
  keyboardOverlayBottom: 0xfa000000,
  keyboardHeaderText: 0xf0ffffff,
  keyboardInputBg: 0x40000000,
  keyboardPlaceholderText: 0x50ffffff,
  keyboardInputText: 0xffffffff,
  keyboardShaderBg: 0x40ffffff,

  passwordCheckInactive: 0x30ffffff,
  passwordCheckInactiveInner: 0x25ffffff,
  passwordCheckInactiveIcon: 0x40ffffff,
  passwordCheckInactiveText: 0x60ffffff,
  passwordCheckActiveIcon: 0xff000000,

  errorFieldBackground: 0xff3d1a1a,
} as const;

export type ColorKey = keyof typeof Colors;
