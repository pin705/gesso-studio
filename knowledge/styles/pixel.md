# Style pack: Pixel art

**Mood**: crisp, deliberate, retro or neo-retro. Every pixel is a decision.

## Grid rules (non-negotiable)
- Canvas at native resolution: width/height and viewBox equal the pixel size (16, 24, 32, 48, 64). Export at integer scales only (2, 3, 4).
- Draw with integer-aligned `<rect>` elements or integer-coordinate paths, `shape-rendering="crispEdges"` on the root.
- No gradients, blur, filters, rotation or semi-transparency (one or two alpha levels only for glass or ghosts).

## Palette
Limited: 16-32 colors, organized as ramps with hue shifting. Example (Sweetie 16): #1a1c2c #5d275d #b13e53 #ef7d57 #ffcd75 #a7f070 #38b764 #257179 #29366f #3b5dc9 #41a6f6 #73eff7 #f4f4f4 #94b0c2 #566c86 #333c57.

## Technique
- Light top-left. Shade with 3-4 steps per ramp; clusters of pixels, not scattered noise.
- Selective outline (selout): outline pixels take a darker shade of the adjacent fill instead of one black line; darkest at the bottom-right.
- Avoid pillow shading (shading that follows the outline inward from all sides) and banding (stair-steps of different colors running parallel).
- Clean lines: consistent step lengths on curves (1-1-2-2-3 or 3-2-2-1-1), no jaggies or orphan pixels.
- Anti-alias by hand only on long curves, with intermediate ramp colors; dither only for large gradients and only in regular patterns.

## UI kit
9-slice frames with pixel-perfect corners (insets on whole pixels), 1px bevel lines, buttons with a 1-2px lip.

## Don'ts
Mixed pixel sizes; smooth vector curves; soft glows; more colors than the palette; sub-pixel coordinates.
