# Constraints Definition

This file defines the current rules and constraints for Facet image generation.

## Purpose

Define deterministic and probabilistic rules so generated images follow Measured's visual identity while still producing useful variation.

## References

- /\_Measured_Brand_Refresh_Version_05.pdf

## Current scope

- Single primitive in active use: The Corner SVG shape.
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
- Center balance rule:
  - Candidate placement blends uniform and center-biased sampling.
  - Candidate acceptance also checks centroid balance target/slack.

## Acceptance behavior

- Candidate acceptance is currently based on:
  - Same-color overlap rejection
  - Center-balance acceptance check
- Practical result:
  - Density behaves as a max-cap, not an exact target count.
  - Gaps can still appear; full 100% fill is not guaranteed.

## Runtime controls

UI controls currently exposed in sidebar:

- `Centre`
- `Density`
- `Edge`
- `Flip X`
- `Flip Y`
- `Opacity`
- `Outline`
- `Size`
- `Variance`
- `Weight`

Current defaults:

- `Centre`: 50%
- `Density`: 0% (maps to 1 max shape)
- `Edge`: 50%
- `Flip X`: 0%
- `Flip Y`: 0%
- `Opacity`: 75%
- `Outline`: 0%
- `Size`: 75%
- `Variance`: 50%
- `Weight`: 50%

Control semantics:

- `Density` maps `0..100%` to shape max `1..UI_DENSITY_MAX` (currently 50).
- `Edge` maps `0..100%` to off-canvas sampling allowance during candidate placement.
- `Size` maps non-linearly to internal size control:
  - `0..75%` maps to size control `0.1..1.0`
  - `75..100%` maps to size control `1.0..2.0`
- `Variance` maps `0..100%` to internal size spread `0.0..1.0`.
- `Weight` maps `0..100%` to thin/thick stroke selection probability.
- `Weight` is disabled when `Outline` is `0%`.
- `Opacity` is disabled when `Outline` is `100%` or `Density` is `0%`.
- `Centre` maps to center-biased placement pull during candidate sampling.
- Centroid acceptance target/slack is fixed as internal tuning constants.

## URL parameter persistence

Control and seed state persist in compact URL params.

Canonical order:

- `s` (seed)
- `ct` (Centre)
- `dn` (Density)
- `ed` (Edge)
- `fx` (Flip X)
- `fy` (Flip Y)
- `op` (Opacity)
- `ot` (Outline)
- `sz` (Size)
- `vr` (Variance)
- `wg` (Weight)

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
  - `facet-s{seed}-ct{ct}-dn{dn}-ed{ed}-fx{fx}-fy{fy}-op{op}-ot{ot}-sz{sz}-vr{vr}-wg{wg}.{ext}`
