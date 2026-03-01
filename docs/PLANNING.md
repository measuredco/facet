# Project Plan

## Project name

Facet

## Elevator pitch

A lightweight p5.js app for generating seeded, constraint-driven brand compositions that designers can iterate in-browser and export.

## Product goals

- Generate deterministic compositions from a compact set of brand constraints.
- Allow fast visual iteration through sidebar controls.
- Preserve reproducibility through URL seed/control params.
- Keep setup and runtime simple for local development.

## Current scope

- Single-page app.
- Multiple approved components selectable at runtime.
- Runtime control panel for composition tuning.
- PNG and SVG export.
- Constraint handling direction: strict reject on rule violations.

## Current UX model

- Header actions:
  - `Randomise` (randomise settings)
  - `Shuffle` (new seed with current settings)
  - `Ratio` (dropdown with ratio options)
  - `Export` (dropdown with PNG/SVG actions)
  - Settings toggle (sidebar visibility)
- Main preview:
  - Responsive canvas (active ratio)
- Controls sidebar:
  - `Component` (includes `Mix` radio option), `Colour`, `Amount`, `Centre`, `Edge`, `Flip X`, `Flip Y`, `Size`, `Spread`, `Blend`, `Light`, `Opacity`, `Outline`, `Weight`, `Dots`, `Screen`
  - `Color lock` (checkbox), `Reset`

## State and persistence

- No backend persistence.
- URL query params persist runtime state:
  - `s`, `r`, `cl`, `cm`, `a`, `cn`, `e`, `fx`, `fy`, `sz`, `sp`, `b`, `l`, `op`, `ot`, `w`, `d`, `sc`
  - `cm=mx` enables mixed-component generation.
- Reload reproduces output for same seed + control state.

## Tech stack

- HTML + CSS + vanilla JS
- p5.js (npm) + Vite

## Current implementation status

- Sidebar toggle behavior is wired and synchronized with layout.
- Canvas regeneration is deterministic per seed.
- Runtime controls are fully wired and update URL state.
- Colour presets are wired (`ad`, `al`, `cy`, `or`, `nd`, `nl`) and persist via URL and filename.
- Ratio menu is wired and drives preview/export dimensions.
- Randomise, Shuffle, and Reset are implemented.
- Candidate acceptance has been refactored into a centralized validator helper with no visual regression in manual snapshot checks.
- Accessibility baseline improvements in place:
  - Labeled controls landmark
  - Canvas description text alternative
  - Toggle button `aria-expanded` state syncing

## Opportunity roadmap

### Now

### Next

- Tooltip text for sliders
- Tooltip text for settings button
- Add a share button

#### Offline-first

- Goal: app shell and generation flow should work offline after first successful online visit.
- Implement with `vite-plugin-pwa` (Workbox), not custom service worker logic.
- Enable service worker only for production builds/deploy; keep it off in local dev to avoid stale-cache iteration issues.
- Service worker strategy:
  - Precache hashed JS/CSS assets and key static assets from `public/` (icons, manifest, font).
  - Use navigation fallback to `index.html` so deep links and URL params still load app offline.
  - Use `cleanupOutdatedCaches` and auto-update registration to reduce stale asset drift across deploys.
- Cloudflare cache policy:
  - `index.html`: short/no-cache (`no-cache`) so fresh asset references are discovered quickly.
  - Hashed assets (`/assets/*`): long immutable cache.
- Validation pass before launch:
  - Build + preview.
  - Install PWA.
  - Go offline and confirm app reloads, generates, and exports PNG/SVG.
  - Deploy update and verify service worker picks up new build without manual cache clearing.
- Docs updates:
  - README section for offline behavior, first-load requirement, and update expectations.

### Later

- Consider adding text feature, to optional add a textual element to compositions _values below calculated for a 1200 × 630 OG image_
  - no rich text, string only
  - `--color-white` (probably?)
  - (optional) backplate for legibility? could use background color from constraints, maybe with (configurable) opacity
  - `--font-family` (InterVariable.subset.woff2)
  - `--font-11-size`, `--font-11-line-height`, `font-weight: 300`
  - 2–3 line limit, max 50 characters
  - Prioritize deterministic rendering parity between preview and export.

## Acceptance tests

- App runs locally via static server.
- Randomise randomizes settings and regenerates.
  - `Colour` randomization is controlled by `Color lock`.
- Shuffle creates new seeded output with current settings.
- URL params reproduce seeded output and controls.
- Sidebar controls change composition and persist to URL.
- Ratio menu offers `16:9`, `OG`, `1:1`, and `4:5`.
- Changing Ratio updates preview ratio while keeping responsive max preview behavior.
- Export menu offers `Hi-res`, `Web`, and `Vector`.
- `Hi-res` exports PNG size for active Ratio.
- `Web` exports PNG size for active Ratio.
- `Vector` exports SVG at current canvas dimensions.
