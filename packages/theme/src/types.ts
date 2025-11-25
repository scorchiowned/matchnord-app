export interface SemanticColorSet {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart: [string, string, string, string, string];
}

export interface TypographyScale {
  baseFamily: string;
  headingFamily?: string;
  baseSize: string;
  bodyWeight: number | string;
  headingWeight: number | string;
}

export interface RadiiScale {
  base: string;
  md: string;
  sm: string;
  pill: string;
}

export interface SpacingScale {
  containerPadding: string;
  sectionGap: string;
}

export interface ThemeModeConfig {
  name: string;
  colors: SemanticColorSet;
  customProperties?: Record<string, string>;
}

export interface ThemeTemplate {
  name: string;
  description?: string;
  typography: TypographyScale;
  radii: RadiiScale;
  spacing: SpacingScale;
  modes: {
    light: ThemeModeConfig;
    dark?: ThemeModeConfig;
  };
  sharedColors?: Record<string, string>;
}
