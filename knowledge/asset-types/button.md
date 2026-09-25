# Buttons

## Deliverables
- States as separate files from one master: `btn-x` (normal), `btn-x.pressed`, `btn-x.disabled`, plus `btn-x.hover` on desktop and `btn-x.selected` for toggles or tabs.
- Hierarchy: primary (CTA, the art bible accent), secondary (neutral material), destructive (danger ramp), icon buttons (square or round, 1:1).

## Size (1x at the reference resolution)
- 1920×1080 desktop: primary about 280×72, secondary 220×60, icon button 64×64.
- 1080×1920 portrait mobile: primary about 460×150, secondary 360×120, icon button 132×132; touch targets never below 88px at 1x.
- Canvas includes the drop shadow and any glow: 6-12px of padding around the body.

## Textless with a label zone
The engine renders the localized label. Keep the central 60-70% calm: low contrast, no ornament, value chosen so the art bible's label color (usually light with a dark outline) reads clearly. Icon buttons may carry their glyph as part of the art.

## 9-slice
Ornament lives in the corners, edges are uniform along their length, the center is plain or has a gradient only along the short axis. Set `data-nine-slice="top right bottom left"` in pixels, typically just past the corner ornament. Horizontal buttons often only need 3-slice (left and right caps); still write four values.

## Construction, back to front
1. Soft drop shadow (down, not black).
2. Outer rim or base: silhouette in the darkest ramp step, the "outline".
3. Side or lip for chunky styles: a darker copy offset 4-10px down, giving thickness.
4. Face: material fill (see `materials`), shaded for its form (convex face lighter at top).
5. Bevel lips: light top edge, dark bottom edge (`svg-craft`).
6. Face detail: inner line or inset frame, material texture, ornaments in the corners.
7. Highlights: gloss or reflection band at the top (style dependent), one or two specular pops.

## State logic
- Pressed: face and ornaments move down by the lip thickness (or 2-4px), the lip and drop shadow shrink, the top light lip weakens, the face darkens one ramp step. Silhouette footprint stays the same so layout does not jump.
- Hover: one ramp step lighter or a thin rim light; never a different shape.
- Disabled: desaturate 70-90%, flatten contrast, keep the silhouette; the label zone stays readable at lower contrast.
- Selected: accent rim or inner glow in the accent ramp.
