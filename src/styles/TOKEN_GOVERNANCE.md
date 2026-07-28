# Design Token Governance (DS-0)

## Rules

1. **UI SSOT** — All new visual values come from `src/styles/tokens/`.
2. **No hardcoded colors** — Use `--erp-color-*` / `--erp-*` aliases.
3. **No hardcoded spacing** — Use `--erp-space-*` or semantic `--erp-space-sm` etc.
4. **No hardcoded radius** — Use `--erp-radius-*` (including `--erp-radius-md`).
5. **No hardcoded shadows** — Use `--erp-elevation-*` or `--erp-shadow-*`.
6. **No arbitrary z-index** — Use `--erp-z-*` only.
7. **No ad-hoc typography** — Use type tokens / `.erp-*` role classes.
8. **No second brand language** — Workspace/glass uses `--erp-glass-*`, not new `--ws-*` definitions.
9. **Legacy aliases** — `--color-*` and `--ws-*` exist only in `legacy-aliases.css` for compatibility. Do not extend them.
10. **Business frozen** — Do not change hooks, services, SSOT, map engines, or APIs to “fix” styles.

## Allowed

- Extending tokens in `src/styles/tokens/` when a genuine new semantic is needed
- Mapping old tokens to new ones in `legacy-aliases.css`
- Consuming tokens from component/page CSS

## Not allowed

- Tailwind / CSS-in-JS migration in feature work
- Page-local token files that fork Merit branding
- Defining `--erp-radius-md` (or any token) in a page CSS file
- Hardcoded hex for status colors when `--erp-color-booked` etc. exist

## Review checklist

- [ ] New UI uses only `--erp-*` tokens
- [ ] No new `--color-*` / `--ws-*` definitions
- [ ] Z-index from `--erp-z-*`
- [ ] Control heights from `--erp-control-h-*`
- [ ] Motion from tokens or `animations/presets.js`
