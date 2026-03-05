/**
 * Material Design 3 Theme System
 * Pre-defined Professional Color Palettes for Spinning Wheel
 * All colors derived from M3 color theory for optimal contrast and harmony
 */

export interface M3ColorScheme {
  // Primary palette
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  // Secondary palette
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  // Tertiary palette
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  // Error palette
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  // Background & Surface
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceTint: string;
  // Outline
  outline: string;
  outlineVariant: string;
  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  // Special
  shadow: string;
  scrim: string;
}

/**
 * Palette definitions for wheel segments
 * Each palette has 6 vibrant, high-contrast colors
 */
export interface WheelPalette {
  name: string;
  seedColor: string;
  colors: string[];
  background: string;
  surface: string;
}

/**
 * Pre-defined Professional Palettes
 * Optimized for projector visibility and fun aesthetics
 */
export const WHEEL_PALETTES: WheelPalette[] = [
  {
    name: "Vibrant Sunset",
    seedColor: "#FF5A36",
    colors: [
      "#FF5A36", // Hot orange
      "#FF8E3C", // Sunset orange
      "#FFB95A", // Warm amber
      "#E63946", // Coral red
      "#F77F00", // Flame orange
      "#D7263D", // Punch red
    ],
    background: "#18151F",
    surface: "#272231",
  },
  {
    name: "Electric Night",
    seedColor: "#6C5CE7",
    colors: [
      "#6C5CE7", // Electric indigo
      "#3A86FF", // Charged blue
      "#00B4D8", // Neon cyan
      "#8338EC", // Violet
      "#4361EE", // Royal blue
      "#00A6FB", // Sky electric
    ],
    background: "#111423",
    surface: "#1F2840",
  },
  {
    name: "Tropical Forest",
    seedColor: "#00A878",
    colors: [
      "#00A878", // Tropical green
      "#2D936C", // Forest green
      "#1B998B", // Teal lagoon
      "#2EC4B6", // Aqua mint
      "#3FA34D", // Leaf green
      "#1E6F5C", // Deep jungle
    ],
    background: "#101C19",
    surface: "#1B2D2A",
  },
  {
    name: "Berry Punch",
    seedColor: "#C9184A",
    colors: [
      "#C9184A", // Berry red
      "#A4133C", // Dark berry
      "#7B2CBF", // Purple
      "#9D4EDD", // Lavender purple
      "#D81159", // Punch pink
      "#8E44AD", // Plum
    ],
    background: "#1B1220",
    surface: "#2B1D35",
  },
  {
    name: "Fiesta",
    seedColor: "#FF006E",
    colors: [
      "#FF006E", // Neon pink
      "#FB5607", // Bright orange
      "#FFBE0B", // Pop yellow
      "#3A86FF", // Electric blue
      "#06D6A0", // Mint neon
      "#8338EC", // Neon violet
    ],
    background: "#110F1A",
    surface: "#1B243A",
  },
];

/**
 * Default dark theme color scheme
 */
export const defaultTheme: M3ColorScheme = {
  primary: "#FFB585",
  onPrimary: "#5C2E00",
  primaryContainer: "#CC5600",
  onPrimaryContainer: "#FFDCC3",
  secondary: "#FFD56B",
  onSecondary: "#453600",
  secondaryContainer: "#CC9A00",
  onSecondaryContainer: "#FFE9B0",
  tertiary: "#FFB0C9",
  onTertiary: "#71003B",
  tertiaryContainer: "#CC1F5E",
  onTertiaryContainer: "#FFD9E6",
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  background: "#1C1B1F",
  onBackground: "#E6E1E5",
  surface: "#1C1B1F",
  onSurface: "#E6E1E5",
  surfaceVariant: "#4F4542",
  onSurfaceVariant: "#D3C4BF",
  surfaceTint: "#FFB585",
  outline: "#9A8F8B",
  outlineVariant: "#4F4542",
  inverseSurface: "#E6E1E5",
  inverseOnSurface: "#313033",
  inversePrimary: "#FF6D00",
  shadow: "#000000",
  scrim: "#000000",
};

/**
 * M3 Elevation shadows
 */
export const elevation = {
  0: "none",
  1: "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
  2: "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
  3: "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)",
  4: "0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)",
  5: "0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)",
};

/**
 * M3 Shape tokens
 */
export const shape = {
  cornerNone: "0px",
  cornerExtraSmall: "4px",
  cornerSmall: "8px",
  cornerMedium: "12px",
  cornerLarge: "16px",
  cornerExtraLarge: "28px",
  cornerFull: "9999px",
};

/**
 * M3 Typography scale with clamp() for responsive projection
 */
export const typography = {
  displayLarge: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(3.5rem, 10vw, 7rem)",
    fontWeight: 400,
    lineHeight: "1.1",
    letterSpacing: "-0.015625em",
  },
  displayMedium: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(2.75rem, 8vw, 5.5rem)",
    fontWeight: 400,
    lineHeight: "1.1",
    letterSpacing: "0",
  },
  displaySmall: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(2rem, 6vw, 4rem)",
    fontWeight: 400,
    lineHeight: "1.15",
    letterSpacing: "0",
  },
  headlineLarge: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    fontWeight: 400,
    lineHeight: "1.2",
    letterSpacing: "0",
  },
  headlineMedium: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(1.5rem, 4vw, 2.75rem)",
    fontWeight: 400,
    lineHeight: "1.25",
    letterSpacing: "0",
  },
  headlineSmall: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(1.25rem, 3vw, 2rem)",
    fontWeight: 400,
    lineHeight: "1.3",
    letterSpacing: "0",
  },
  titleLarge: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
    fontWeight: 500,
    lineHeight: "1.3",
    letterSpacing: "0",
  },
  titleMedium: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
    fontWeight: 500,
    lineHeight: "1.35",
    letterSpacing: "0.00625em",
  },
  titleSmall: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(0.875rem, 2vw, 1.125rem)",
    fontWeight: 500,
    lineHeight: "1.4",
    letterSpacing: "0.00625em",
  },
  bodyLarge: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    fontWeight: 400,
    lineHeight: "1.5",
    letterSpacing: "0.00625em",
  },
  bodyMedium: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
    fontWeight: 400,
    lineHeight: "1.5",
    letterSpacing: "0.015625em",
  },
  bodySmall: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(0.75rem, 1.2vw, 1rem)",
    fontWeight: 400,
    lineHeight: "1.5",
    letterSpacing: "0.015625em",
  },
  labelLarge: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
    fontWeight: 500,
    lineHeight: "1.3",
    letterSpacing: "0.00625em",
  },
  labelMedium: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(0.75rem, 1.2vw, 1rem)",
    fontWeight: 500,
    lineHeight: "1.3",
    letterSpacing: "0.03125em",
  },
  labelSmall: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "clamp(0.625rem, 1vw, 0.875rem)",
    fontWeight: 500,
    lineHeight: "1.3",
    letterSpacing: "0.03125em",
  },
};

/**
 * Animation timing functions
 */
export const motion = {
  easingEmphasized: "cubic-bezier(0.2, 0.0, 0.0, 1.0)",
  easingStandard: "cubic-bezier(0.2, 0.0, 0.0, 1.0)",
  easingDecelerate: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  easingAccelerate: "cubic-bezier(0.4, 0.0, 1, 1)",
  durationShort: 150,
  durationMedium: 300,
  durationLong: 500,
  durationExtraLong: 1000,
};

/**
 * Utility function to determine text color based on background brightness
 * Returns white text for dark backgrounds, black for light backgrounds
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
