# Merit ERP Design Tokens (DS-0)

UI single source of truth for visual language. **Do not invent new colors, spacing, type, radius, shadows, or z-index in pages.**

## Location

```
src/styles/tokens/
  index.css           # import order
  colors.css
  typography.css
  spacing.css
  radius.css
  elevation.css
  motion.css
  z-index.css
  controls.css
  states.css
  breakpoints.css
  icons.css
  glass.css
  a11y.css
  legacy-aliases.css  # backward-compat only
```

Loaded via `src/styles/global.css` → `@import './tokens/index.css'`.

## Naming convention

| Pattern | Example | Use |
|---------|---------|-----|
| `--erp-color-*` | `--erp-color-accent` | Canonical colors |
| `--erp-*` short | `--erp-accent`, `--erp-card` | Everyday aliases |
| `--erp-space-{n}` | `--erp-space-16` | Spacing (4px grid) |
| `--erp-radius-*` | `--erp-radius-md` | Corners |
| `--erp-elevation-*` | `--erp-elevation-floating` | Named elevation |
| `--erp-shadow-*` | `--erp-shadow-sm` | Legacy shadow scale |
| `--erp-duration-*` | `--erp-duration-250` | Motion |
| `--erp-ease-*` | `--erp-ease-entrance` | Easing |
| `--erp-z-*` | `--erp-z-drawer` | Stacking |
| `--erp-control-h-*` | `--erp-control-h-md` | Control heights |
| `--erp-icon-*` | `--erp-icon-md` | Icon sizes |
| `--erp-glass-*` | `--erp-glass-bg` | Glass / workspace |
| `--erp-bp-*` | `--erp-bp-tablet-min` | Breakpoints |
| `--erp-state-*` | `--erp-state-selected-bg` | Interaction states |
| `--erp-a11y-*` | `--erp-a11y-min-touch` | Accessibility |

**Deprecated for new code:** `--color-*`, `--ws-*`, raw hex in page CSS, arbitrary `z-index`.

## Breakpoints (contract)

| Name | Token | Value |
|------|-------|-------|
| Mobile max | `--erp-bp-mobile-max` | 767px |
| Tablet | `--erp-bp-tablet-min` … `max` | 768–1023 |
| Laptop | `--erp-bp-laptop-min` … `max` | 1024–1439 |
| Desktop | `--erp-bp-desktop-min` | 1440+ |
| Ultra wide | `--erp-bp-ultrawide-min` | 1920+ |

Use the same pixel values in `@media` queries (CSS custom properties are not reliably supported inside `@media` in all browsers).

## Motion (JS)

`src/animations/presets.js` exports `DURATION` and `EASE*` mirrored from CSS tokens. Prefer presets over inline Framer configs.

## Governance

See [TOKEN_GOVERNANCE.md](./TOKEN_GOVERNANCE.md).

## Future roadmap

- **DS-1** — Atom/molecule API completeness + barrel discipline  
- **DS-2** — Page patterns (List / Detail / Dashboard / Workspace)  
- **DS-3** — Enforce presets + replace remaining hardcoded values in page CSS  
- **DS-4** — Optional Storybook / visual regression (not required for product)
