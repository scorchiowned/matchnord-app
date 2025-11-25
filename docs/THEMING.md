# MatchNord Theming System

This repository now ships with a shared theming layer that keeps `matchnord-app` and `matchnord-extranet` aligned while letting us roll out new skins quickly.

## Package layout

```
packages/theme/
  ├─ src/
  │  ├─ tokens.ts                # Brand palette + typography defaults
  │  ├─ templates/               # Theme template definitions per surface
  │  ├─ utils/css.ts             # Helpers to generate CSS variables
  │  └─ utils/tailwind.ts        # Helper to extend tailwind config
```

Key exports:

- `matchnordBaseTemplate` – base semantic palette.
- `matchnordAppTemplate` / `matchnordExtranetTemplate` – app-specific overrides.
- `createThemeCss(template)` – builds the `<style>` payload injected by Next layouts.
- `extendTailwindTheme(template)` – returns a `theme.extend` fragment so Tailwind colors/fonts stay in sync with the CSS variables.

## How apps consume a template

1. **Inject CSS variables in the root layout**
   ```tsx
   import { createThemeCss, matchnordExtranetTemplate } from '@matchnord/theme';

   const themeCss = createThemeCss(matchnordExtranetTemplate);

   export default function Layout({ children }) {
     return (
       <html lang="fi">
         <head>
           <style dangerouslySetInnerHTML={{ __html: themeCss }} />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

2. **Share Tailwind tokens**
   ```ts
   import { extendTailwindTheme, matchnordExtranetTemplate } from '../packages/theme/src';

   const sharedTheme = extendTailwindTheme(matchnordExtranetTemplate);

   export default {
     theme: {
       extend: {
         ...sharedTheme,
       },
     },
   }
   ```

3. **Use semantic utilities**
   Use Tailwind classes like `bg-background`, `text-foreground`, `bg-style-primary`, etc. The underlying CSS variables update when a template changes.

## Creating a new template

1. Copy `packages/theme/src/templates/matchnord-base.ts` into a new file.
2. Adjust typography, radii, spacing, and `modes.light` / `modes.dark` colors.
3. (Optional) add `customProperties` if the surface needs additional CSS variables and list them under `sharedColors` to expose Tailwind aliases.
4. Export the template from `packages/theme/src/index.ts`.
5. Point the desired app’s layout + `tailwind.config.ts` to the new template.

## Updating design tokens

- Palette tweaks live in `packages/theme/src/tokens.ts`.
- Typography defaults live in `matchnord-base` but can be overridden per template.
- Because both CSS variables and Tailwind colors share the same data, updating a value in a template instantly updates both apps the next time they build.

## Maintenance tips

- Keep template names descriptive (`matchnord-dark`, `partner-acme`, etc.).
- Add unit tests under `packages/theme` if we start generating templates programmatically.
- When editing custom properties, also update `sharedColors` so Tailwind classes stay available.
- If a page needs runtime theme switching, consume `createThemeCss` and inject styles based on the active template.
