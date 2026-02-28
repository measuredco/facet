# Constraints Definition

This file defines the current rules and constraints for Facet image generation.

## Purpose

Define deterministic and probabilistic rules so generated images follow Measured's visual identity while still producing useful variation.

## References

- /\_Measured_Brand_Refresh_Version_05.pdf

## Current scope

- Approved component options in active use (in UI order): `tc`, `ls`, `lt`, `ss`, `st`, `mx`.
- Seeded, deterministic generation with runtime UI controls.
- PNG and SVG export.

## Global parameters

- Ratio options:
  - `l` (`16:9`, landscape): preview base `800x450`
  - `og` (`1.91:1`, Open Graph): preview base `800x419`
  - `s` (`1:1`, square): preview base `800x800`
  - `p` (`4:5`, portrait): preview base `800x1000`
- Color mode: RGB
- Seed handling:
  - `Randomise` randomizes settings and regenerates (except `Colour`).
  - `Seed` creates a new random seed while retaining current settings.
  - Active seed is persisted in URL query param `s`.
  - Loading a URL with a seed reproduces the same output for the same control values.
- Default ratio: `l` (`16:9`)
- Default colour preset: `ad` (`Azure dark`)

## Palette rules

- Colour presets:
  - `ad` (Azure dark)
    - Background: `#031f60`
    - Shape palette: `#072d75`, `#083c8a`, `#0158ad`, `#6db5f8`
  - `al` (Azure light)
    - Background: `#edf6fe`
    - Shape palette: `#083c8a`, `#1666bb`, `#2a84e1`, `#3598f8`
  - `cy` (Cyan)
    - Background: `#00161a`
    - Shape palette: `#00333c`, `#014a53`, `#03636b`, `#55b7bd`
  - `or` (Orange)
    - Background: `#fef4e8`
    - Shape palette: `#773604`, `#ad5601`, `#cb6503`, `#ea7407`
  - `nd` (Neutral dark)
    - Background: `#0b0c0d`
    - Shape palette: `#656667`, `#898a8b`, `#c8c9ca`, `#e3e4e5`
  - `nl` (Neutral light)
    - Background: `#ffffff`
    - Shape palette: `#232424`, `#434444`, `#656667`, `#e3e4e5`

## Shape rules

- Components in use:
  - `tc`: The Corner (viewBox `0 0 360 360`)
  - `ls`: Large Tile Slice (viewBox `0 0 360 360`)
  - `lt`: Large Tile (viewBox `0 0 720 720`)
  - `ss`: Small Tile Slice (viewBox `0 0 200 200`)
  - `st`: Small Tile (viewBox `0 0 400 400`)
  - `mx`: Mix mode (per-shape uniform random selection across `tc/ls/lt/ss/st`)
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
- `Colour`
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
- `Dots`
- `Screen`

Current defaults:

- `Component`: `The corner` (`tc`)
- `Colour`: `Azure dark` (`ad`)
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
- `Dots`: 0%
- `Screen`: 0%

Component values (UI order):

- `tc`: The corner
- `ls`: Large tile slice
- `lt`: Large tile
- `ss`: Small tile slice
- `st`: Small tile
- `mx`: Mix mode (uniform 20% selection across `tc/ls/lt/ss/st` per shape)

Control semantics:

- `Amount` maps `0..100%` to shape max `1..UI_DENSITY_MAX` (currently 50).
- `Colour` selects active background + 4-colour palette preset (`ad`, `al`, `cy`, `or`, `nd`, `nl`).
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
- `Dots` maps `0..100%` to halftone dot scale.
- `Dots` is disabled when `Screen` is `0%`.
- `Screen` maps `0..100%` to halftone intensity.
- `Opacity` is disabled when `Outline` is `100%` or `Amount` is `0%`.
- `Blend` is disabled when `Amount` is `0%`.
- `Flip X` and `Flip Y` are disabled when `Component` is `lt` or `st`, because those two shapes are symmetrical and flips produce no visual difference.
  - In `mx` mix mode, flip controls remain enabled.
- `Centre` maps to center-biased placement pull during candidate sampling.

## URL parameter persistence

Control and seed state persist in compact URL params.

Canonical order:

- `s` (seed)
- `r` (Ratio)
- `cl` (Colour)
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
- `d` (Dots)
- `sc` (Screen)

## UI behavior

- Settings button toggles sidebar open/closed state.
- Sidebar defaults closed and is toggled explicitly via Settings.
- In narrow viewport (sidebar overlays canvas), clicking outside sidebar closes it.
- In narrow viewport, `Escape` closes sidebar unless a dropdown/listbox menu is currently open.
- In desktop viewport, `Escape` closes sidebar only when focus is inside sidebar and no dropdown/listbox menu is open.
- `Ratio` menu selects active ratio (`l`, `og`, `s`, `p`).
- `Reset` restores all controls to defaults.
- `Randomise` assigns random values to controls (excluding `Colour`) and regenerates.
- `Seed` generates a new seed and keeps current settings.
- Canvas has a descriptive text alternative and the controls panel is a labeled complementary landmark.

## Output behavior

- Export formats:
  - `Hi-res`: PNG size depends on active Ratio
  - `Web`: PNG size depends on active Ratio
  - `Vector`: SVG at current canvas dimensions (responsive preview size)
- Post-process effects:
  - `Dots` + `Screen` are raster post-process controls and apply to preview and PNG exports.
  - `Vector` SVG export does not include raster post-process effects.
- Ratio export mapping:
  - `l` (`16:9`): Hi-res `7680x4320`, Web `1920x1080`
  - `og` (`OG`, `1.91:1`): Hi-res `7680x4020`, Web `1200x630`
  - `s` (`1:1`): Hi-res `4320x4320`, Web `1600x1600`
  - `p` (`4:5`): Hi-res `4320x5400`, Web `1600x2000`
- Filename includes seed + control params:
  - `facet-{seed}-{r}-{cl}-{cm}-a{a}cn{cn}e{e}fx{fx}fy{fy}sz{sz}sp{sp}b{b}l{l}op{op}ot{ot}w{w}d{d}sc{sc}.{ext}`
