import { palette } from '../tokens';
import { ThemeTemplate } from '../types';
import { matchnordBaseTemplate } from './matchnord-base';

const appLightColors = {
  ...matchnordBaseTemplate.modes.light.colors,
  primary: '#111827',
  primaryForeground: '#f8fafc',
  accent: palette.brand.blue,
  accentForeground: '#ffffff',
  border: '#e5e7eb',
};

const appDarkColors = {
  ...matchnordBaseTemplate.modes.dark!.colors,
  accent: palette.brand.blue,
  accentForeground: '#e2e8f0',
};

export const matchnordAppTemplate: ThemeTemplate = {
  ...matchnordBaseTemplate,
  name: 'matchnord-app',
  description: 'Public MatchNord portal theme',
  typography: {
    ...matchnordBaseTemplate.typography,
    baseFamily: "'Inter', 'Roboto', 'system-ui', sans-serif",
    headingFamily: "'Space Grotesk', 'Inter', 'system-ui', sans-serif",
    baseSize: '16px',
  },
  modes: {
    light: {
      name: 'light',
      colors: appLightColors,
    },
    dark: {
      name: 'dark',
      colors: appDarkColors,
    },
  },
};
