import type { Config } from 'tailwindcss';
import { extendTailwindTheme, matchnordExtranetTemplate } from '../packages/theme/src';

const sharedTheme = extendTailwindTheme(matchnordExtranetTemplate);

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: 'var(--container-padding, 2rem)',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      ...sharedTheme,
      fontWeight: {
        'style-heading': '700',
        'style-body': '400',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

export default config;
