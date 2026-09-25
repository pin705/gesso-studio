# VFX (animated effects)

VFX ship as flipbooks: `export_assets` samples the animated SVG into a sprite sheet. Set `data-type="vfx"`, `data-duration` (seconds) and `data-frames` (8-16 for hits, 16-32 for loops).

## Timing
- Anticipation (0-15%): a faint gather or flash-in.
- Impact (15-30%): the brightest, biggest shape, held 1-2 frames. This frame sells the hit.
- Dissipation (30-100%): the longest part; shapes thin, drift, cool in color and fade.
- Hits last 0.3-0.8s, spells 0.6-1.5s. Loops (auras, portals) must match exactly at start and end.
- Ease out almost everything: fast start, slow end (`keySplines=".2 .8 .2 1"`).

## Shape and color
- Primary shape first (slash crescent, burst ring, beam), then secondary elements (sparks, debris, smoke) that follow the primary's motion direction.
- Slashes are crescents tapered at both ends, thickest near the leading third; never a uniform stroke.
- Color runs core to edge: near-white core, saturated hue, darker hue at the edges, transparent. Over time the hue cools or darkens as energy dissipates.
- Opacity and scale change over time; avoid linear fades of the whole effect.

## Canvas and blending
- Square canvas (256, 512) centered on the effect's origin, with room for the largest frame; nothing may clip.
- Transparent background. Assume additive or screen blending in engine for glows; keep a slightly darker edge so it also reads with normal blending.
- Keep element counts modest (under ~300) so frames render and export quickly.
