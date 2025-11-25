import { palette, typography } from '../tokens';
import { ThemeTemplate } from '../types';

const baseLightColors = {
  background: '#ffffff',
  foreground: palette.neutrals[900],
  card: '#ffffff',
  cardForeground: palette.neutrals[900],
  popover: '#ffffff',
  popoverForeground: palette.neutrals[900],
  primary: '#0f172a',
  primaryForeground: '#f8fafc',
  secondary: palette.neutrals[100],
  secondaryForeground: palette.neutrals[900],
  muted: palette.neutrals[100],
  mutedForeground: palette.neutrals[500],
  accent: palette.neutrals[100],
  accentForeground: palette.neutrals[900],
  destructive: palette.brand.red,
  destructiveForeground: '#ffffff',
  border: palette.neutrals[200],
  input: palette.neutrals[200],
  ring: palette.neutrals[900],
  chart: [
    '#f97316',
    '#0ea5e9',
    '#22c55e',
    '#a855f7',
    '#facc15',
  ] as const,
};

const baseDarkColors = {
  background: '#030712',
  foreground: '#f8fafc',
  card: '#030712',
  cardForeground: '#f8fafc',
  popover: '#030712',
  popoverForeground: '#f8fafc',
  primary: '#f8fafc',
  primaryForeground: '#0f172a',
  secondary: '#111827',
  secondaryForeground: '#f8fafc',
  muted: '#111827',
  mutedForeground: '#94a3b8',
  accent: '#111827',
  accentForeground: '#f8fafc',
  destructive: '#7f1d1d',
  destructiveForeground: '#f8fafc',
  border: '#1f2937',
  input: '#1f2937',
  ring: '#e2e8f0',
  chart: [
    '#60a5fa',
    '#34d399',
    '#fbbf24',
    '#c084fc',
    '#fb7185',
  ] as const,
};

export const matchnordBaseTemplate: ThemeTemplate = {
  name: 'matchnord-base',
  description: 'Base theme used across MatchNord properties',
  typography: {
    baseFamily: typography.baseFamily,
    headingFamily: typography.headingFamily,
    baseSize: '16px',
    bodyWeight: 400,
    headingWeight: 600,
  },
  radii: {
    base: '10px',
    md: '8px',
    sm: '6px',
    pill: '999px',
  },
  spacing: {
    containerPadding: '2rem',
    sectionGap: '2.5rem',
  },
  modes: {
    light: {
      name: 'light',
      colors: baseLightColors,
    },
    dark: {
      name: 'dark',
      colors: baseDarkColors,
    },
  },
};
