import { ThemeModeConfig, ThemeTemplate } from '../types';

const semanticColorEntries: Array<[keyof ThemeModeConfig['colors'], string]> = [
  ['background', '--background'],
  ['foreground', '--foreground'],
  ['card', '--card'],
  ['cardForeground', '--card-foreground'],
  ['popover', '--popover'],
  ['popoverForeground', '--popover-foreground'],
  ['primary', '--primary'],
  ['primaryForeground', '--primary-foreground'],
  ['secondary', '--secondary'],
  ['secondaryForeground', '--secondary-foreground'],
  ['muted', '--muted'],
  ['mutedForeground', '--muted-foreground'],
  ['accent', '--accent'],
  ['accentForeground', '--accent-foreground'],
  ['destructive', '--destructive'],
  ['destructiveForeground', '--destructive-foreground'],
  ['border', '--border'],
  ['input', '--input'],
  ['ring', '--ring'],
];

const chartVarNames = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

function buildVariableMap(template: ThemeTemplate, mode: ThemeModeConfig): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [colorKey, cssVarName] of semanticColorEntries) {
    const value = mode.colors[colorKey];
    vars[cssVarName] = value;
  }

  mode.colors.chart.forEach((value, index) => {
    const cssVarName = chartVarNames[index];
    vars[cssVarName] = value;
  });

  vars['--font-base'] = template.typography.baseFamily;
  vars['--font-heading'] = template.typography.headingFamily ?? template.typography.baseFamily;
  vars['--font-size-base'] = template.typography.baseSize;
  vars['--font-weight-body'] = `${template.typography.bodyWeight}`;
  vars['--font-weight-heading'] = `${template.typography.headingWeight}`;

  vars['--radius'] = template.radii.base;
  vars['--radius-lg'] = template.radii.base;
  vars['--radius-md'] = template.radii.md;
  vars['--radius-sm'] = template.radii.sm;
  vars['--radius-pill'] = template.radii.pill;

  vars['--container-padding'] = template.spacing.containerPadding;
  vars['--section-gap'] = template.spacing.sectionGap;

  if (mode.customProperties) {
    for (const [key, value] of Object.entries(mode.customProperties)) {
      vars[key] = value;
    }
  }

  return vars;
}

function toCssBlock(selector: string, vars: Record<string, string>) {
  const body = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}

export interface ThemeCssOptions {
  selector?: string;
  darkSelector?: string;
}

export function createThemeCss(template: ThemeTemplate, options: ThemeCssOptions = {}) {
  const selector = options.selector ?? ':root';
  const darkSelector = options.darkSelector ?? '.dark';

  const lightCss = toCssBlock(selector, buildVariableMap(template, template.modes.light));
  const darkCss = template.modes.dark
    ? `\n${toCssBlock(darkSelector, buildVariableMap(template, template.modes.dark))}`
    : '';

  return `${lightCss}${darkCss}\n`;
}

export function getThemeVariables(template: ThemeTemplate, mode: 'light' | 'dark' = 'light') {
  const config = mode === 'light' ? template.modes.light : template.modes.dark ?? template.modes.light;
  return buildVariableMap(template, config);
}
