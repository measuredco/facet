# Constraints Definition

This file defines the current rules and constraints for Facet image generation.

## Purpose

Define deterministic and probabilistic rules so generated images follow Measured's visual identity while still producing useful variation.

## References

- /\_Measured_Brand_Refresh_Version_05.pdf

## Current scope

- Approved component set in active use (in UI order): `tc`, `ls`, `lt`, `ss`, `st`.
- Seeded, deterministic generation with runtime UI controls.
- PNG and SVG export.

## Global parameters

- Canvas base size: 800x450
- Aspect ratio: 16:9
- Color mode: RGB
- Seed handling:
  - `Generate` creates a new random seed.
  - Active seed is persisted in URL query param `s`.
  - Loading a URL with a seed reproduces the same output for the same control values.

## Palette rules

- Background color: fixed `#031f60`
- Shape palette:
  - `#072d75`
  - `#083c8a`
  - `#0158ad`
  - `#3598f8`

## Shape rules

- Primitive in use:
  - The Corner (viewBox `0 0 360 360`)
- Shape style modes:
  - Fill only
  - Stroke only (no fill)
- Stroke width behavior:
  - Stroke width ratios: `0.0037` or `0.0148` of shape size
  - Variant selection is seed-driven (default 50/50)
  - Minimum stroke width clamp: 1px
- Allowed transforms:
  - Horizontal flip
  - Vertical flip
  - Both
- Disallowed transforms:
  - Skew/distortion

## Composition rules

- Shapes may overlap.
- Same-color overlap is disallowed:
  - A candidate shape is rejected if it overlaps any existing shape with the same color.
- Layering rule:
  - Filled shapes render below stroke-only shapes.
- Overlap alpha rule:
  - A shape uses reduced alpha only when overlapping a lower filled shape.
  - Overlap with lower stroke-only shapes does not reduce alpha.
- Center placement rule:
  - Candidate placement blends uniform and center-biased sampling.

## Acceptance behavior

- Candidate acceptance is currently based on:
  - Same-color overlap check (strictness controlled by `Blend`)
- Practical result:
  - Amount behaves as a max-cap, not an exact target count.
  - Gaps can still appear; full 100% fill is not guaranteed.

## Runtime controls

UI controls currently exposed in sidebar:

- `Component`
- `Amount`
- `Centre`
- `Edge`
- `Flip X`
- `Flip Y`
- `Size`
- `Spread`
- `Blend`
- `Light`
- `Opacity`
- `Outline`
- `Weight`

Current defaults:

- `Component`: `The corner` (`tc`)
- `Amount`: 0% (maps to 1 max shape)
- `Centre`: 50%
- `Edge`: 50%
- `Flip X`: 0%
- `Flip Y`: 0%
- `Size`: 75%
- `Spread`: 50%
- `Blend`: 0%
- `Light`: 50%
- `Opacity`: 75%
- `Outline`: 0%
- `Weight`: 50%

Component values (UI order):

- `tc`: The corner
- `ls`: Large tile slice
- `lt`: Large tile
- `ss`: Small tile slice
- `st`: Small tile

Control semantics:

- `Amount` maps `0..100%` to shape max `1..UI_DENSITY_MAX` (currently 50).
- `Blend` maps `0..100%` to same-colour overlap rejection strictness.
  - `0%`: reject all same-colour overlaps (strict behavior)
  - `100%`: allow same-colour overlaps
- `Light` maps `0..100%` as:
  - `0%`: stronger bias for earlier/darker palette colors
  - `50%`: even palette use
  - `100%`: stronger bias for later/lighter palette colors
- `Edge` maps `0..100%` to off-canvas sampling allowance during candidate placement.
- `Size` maps non-linearly to internal size control:
  - `0..75%` maps to size control `0.1..1.0`
  - `75..100%` maps to size control `1.0..2.0`
- `Spread` maps `0..100%` to internal size spread `0.0..1.0`.
- `Weight` maps `0..100%` to thin/thick stroke selection probability.
- `Weight` is disabled when `Outline` is `0%`.
- `Opacity` is disabled when `Outline` is `100%` or `Amount` is `0%`.
- `Blend` is disabled when `Amount` is `0%`.
- `Flip X` and `Flip Y` are disabled when `Component` is `lt` or `st`, because those two shapes are symmetrical and flips produce no visual difference.
- `Centre` maps to center-biased placement pull during candidate sampling.

## URL parameter persistence

Control and seed state persist in compact URL params.

Canonical order:

- `s` (seed)
- `cm` (Component)
- `a` (Amount)
- `cn` (Centre)
- `e` (Edge)
- `fx` (Flip X)
- `fy` (Flip Y)
- `sz` (Size)
- `sp` (Spread)
- `b` (Blend)
- `l` (Light)
- `op` (Opacity)
- `ot` (Outline)
- `w` (Weight)

## UI behavior

- Settings button toggles sidebar open/closed state.
- Sidebar defaults closed and is toggled explicitly via Settings.
- `Reset` restores all controls to defaults.
- `Randomise` assigns random values to all controls and regenerates.
- Canvas has a descriptive text alternative and the controls panel is a labeled complementary landmark.

## Output behavior

- Export formats:
  - PNG: fixed `8000x4500` (16:9)
  - SVG: current canvas dimensions (`800x450` base, responsive in UI)
- Filename includes seed + control params:
  - `facet-{seed}{cm}-a{a}cn{cn}e{e}fx{fx}fy{fy}sz{sz}sp{sp}b{b}l{l}op{op}ot{ot}w{w}.{ext}`
