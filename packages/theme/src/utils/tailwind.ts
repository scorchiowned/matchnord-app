import type { Config } from 'tailwindcss';
import { ThemeTemplate } from '../types';

const baseColors = {
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  primary: {
    DEFAULT: 'var(--primary)',
    foreground: 'var(--primary-foreground)',
  },
  secondary: {
    DEFAULT: 'var(--secondary)',
    foreground: 'var(--secondary-foreground)',
  },
  destructive: {
    DEFAULT: 'var(--destructive)',
    foreground: 'var(--destructive-foreground)',
  },
  muted: {
    DEFAULT: 'var(--muted)',
    foreground: 'var(--muted-foreground)',
  },
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
  },
  popover: {
    DEFAULT: 'var(--popover)',
    foreground: 'var(--popover-foreground)',
  },
  card: {
    DEFAULT: 'var(--card)',
    foreground: 'var(--card-foreground)',
  },
  chart: {
    1: 'var(--chart-1)',
    2: 'var(--chart-2)',
    3: 'var(--chart-3)',
    4: 'var(--chart-4)',
    5: 'var(--chart-5)',
  },
};

function formatColorValue(value: string) {
  if (value.includes('var(') || value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
    return value;
  }
  return `var(${value})`;
}

export function extendTailwindTheme(template: ThemeTemplate): Config['theme'] extends { extend: infer R } ? R : never {
  const aliasColors: Record<string, string> = {};

  if (template.sharedColors) {
    for (const [alias, value] of Object.entries(template.sharedColors)) {
      aliasColors[alias] = formatColorValue(value);
    }
  }

  return {
    colors: {
      ...baseColors,
      ...aliasColors,
    },
    fontFamily: {
      base: ['var(--font-base)', 'system-ui', 'sans-serif'],
      heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      style: ['var(--font-base)', 'system-ui', 'sans-serif'],
      'style-heading': ['var(--font-heading)', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      base: 'var(--font-size-base)',
    },
    borderRadius: {
      lg: 'var(--radius-lg)',
      md: 'var(--radius-md)',
      sm: 'var(--radius-sm)',
      pill: 'var(--radius-pill)',
    },
  };
}
