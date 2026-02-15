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
- Single active primitive in generation (The Corner).
- Runtime control panel for composition tuning.
- PNG and SVG export.
- Constraint handling direction: strict reject on rule violations.

## Current UX model

- Header actions:
  - `Generate` (new seed)
  - `Download` (dropdown with PNG/SVG actions)
  - Settings toggle (sidebar visibility)
- Main preview:
  - Responsive 16:9 canvas
- Controls sidebar:
  - `Amount`, `Centre`, `Edge`, `Flip X`, `Flip Y`, `Size`, `Spread`, `Blend`, `Light`, `Opacity`, `Outline`, `Weight`
  - `Reset`, `Randomise`

## State and persistence

- No backend persistence.
- URL query params persist runtime state:
  - `s`, `a`, `c`, `e`, `fx`, `fy`, `sz`, `sp`, `b`, `l`, `op`, `ot`, `w`
- Reload reproduces output for same seed + control state.

## Tech stack

- HTML + CSS + vanilla JS
- p5.js (CDN)

## Current implementation status

- Sidebar toggle behavior is wired and synchronized with layout.
- Canvas regeneration is deterministic per seed.
- Runtime controls are fully wired and update URL state.
- Randomise and Reset are implemented.
- Candidate acceptance has been refactored into a centralized validator helper with no visual regression in manual snapshot checks.
- Accessibility baseline improvements in place:
  - Labeled controls landmark
  - Canvas description text alternative
  - Toggle button `aria-expanded` state syncing

## Opportunity roadmap

### Now

- Primitive roadmap: Reintroduce additional approved primitives intentionally (with explicit constraints updates).

### Next

### Later

- Presets: Introduce constrained presets (`brand-muted`, `brand-bold`, `grid-centric`) after controls/primitive work.
- Validation layer: Add a fuller validation module (explicit rule contracts, reject reasons, and lightweight tests) once core controls and primitives stabilize.
- Enable versioning and include in export filenames.

## Acceptance tests

- App runs locally via static server.
- Generate creates new seeded output.
- URL params reproduce seeded output and controls.
- Sidebar controls change composition and persist to URL.
- Download exports current composition as SVG and PNG.
- Download exports fixed `8000x4500` PNG.
