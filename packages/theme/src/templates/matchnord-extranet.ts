import { palette } from '../tokens';
import { ThemeTemplate } from '../types';
import { matchnordBaseTemplate } from './matchnord-base';

const extranetLightColors = {
  ...matchnordBaseTemplate.modes.light.colors,
  primary: palette.brand.green,
  primaryForeground: '#ffffff',
  accent: palette.brand.yellow,
  accentForeground: palette.neutrals[900],
  secondary: '#f4f7f9',
  muted: '#f4f7f9',
  mutedForeground: palette.neutrals[600],
  border: '#e3e7ec',
  card: '#ffffff',
  cardForeground: palette.neutrals[900],
};

const extranetDarkColors = {
  ...matchnordBaseTemplate.modes.dark!.colors,
  primary: palette.brand.green,
  primaryForeground: '#081c15',
  accent: palette.brand.yellow,
  accentForeground: '#111827',
};

export const matchnordExtranetTemplate: ThemeTemplate = {
  ...matchnordBaseTemplate,
  name: 'matchnord-extranet',
  description: 'Management extranet theme aligned with the MatchNord brand system',
  typography: {
    ...matchnordBaseTemplate.typography,
    baseFamily: "'Roboto', 'Inter', 'system-ui', sans-serif",
    headingFamily: "'Roboto', 'Inter', 'system-ui', sans-serif",
    baseSize: '14px',
    headingWeight: 700,
  },
  modes: {
    light: {
      name: 'light',
      colors: {
        ...extranetLightColors,
      },
      customProperties: {
        '--style-primary': palette.brand.green,
        '--style-primary-dark': palette.brand.greenDark,
        '--style-accent': palette.brand.yellow,
        '--style-background': '#ffffff',
        '--style-card-bg': '#f5f5f5',
        '--style-text-primary': palette.neutrals[900],
        '--style-text-secondary': palette.neutrals[600],
        '--style-border': '#e0e0e0',
        '--style-list-alt': '#fafafa',
      },
    },
    dark: {
      name: 'dark',
      colors: {
        ...extranetDarkColors,
      },
      customProperties: {
        '--style-primary': palette.brand.green,
        '--style-primary-dark': palette.brand.greenDark,
        '--style-accent': palette.brand.yellow,
        '--style-background': '#0b0f19',
        '--style-card-bg': '#0f172a',
        '--style-text-primary': '#f1f5f9',
        '--style-text-secondary': '#94a3b8',
        '--style-border': '#1f2937',
        '--style-list-alt': '#111827',
      },
    },
  },
  sharedColors: {
    'style-primary': 'var(--style-primary)',
    'style-primary-dark': 'var(--style-primary-dark)',
    'style-accent': 'var(--style-accent)',
    'style-background': 'var(--style-background)',
    'style-card-bg': 'var(--style-card-bg)',
    'style-text-primary': 'var(--style-text-primary)',
    'style-text-secondary': 'var(--style-text-secondary)',
    'style-border': 'var(--style-border)',
    'style-list-alt': 'var(--style-list-alt)',
  },
};
