import type { Config } from 'tailwindcss';
import { extendTailwindTheme, matchnordAppTemplate } from '../packages/theme/src';

const sharedTheme = extendTailwindTheme(matchnordAppTemplate);

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
