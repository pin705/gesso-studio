# Panels, windows, frames and cards

## Deliverables
- The frame as a 9-slice asset (`panel-x`), plus separate pieces when the design needs them: header banner, close button, divider, tab, inner card, corner ornament overlays.
- Author a compact canvas (for example 256×192 or 384×256) that already reads as the final panel; the engine stretches it.

## 9-slice rules
- Corners contain every non-repeatable detail (ornaments, rivets, cuts). Insets are the corner size, e.g. `data-nine-slice="48 48 48 48"`.
- Edges must be identical along their stretch direction: straight borders, constant gradients across the edge, no motifs in the middle of an edge.
- The center stretches both ways: flat, or a gradient in one direction only, or a subtle noise that survives stretching. Put rich textures in a separate tiling asset.

## Structure, outside in
1. Drop shadow (soft, below).
2. Outer rim: darkest step, defines the silhouette.
3. Frame band: the material (metal, wood, lacquer, holo line) with bevel lips and edge highlights.
   On the kit: `g-form` on the frame band (or build on `g-panel`, which already separates frame and well). Flat bands without top-left light cap at 3.
4. Inner rim: a thin dark line or a lighter pinline separating frame and content.
5. Content well: calm, lower contrast than the frame, with an inner shadow along its top edge so it sits below the frame.

## Readability
The content area must hold body text in the art bible's text color at 16-24px with a contrast ratio of at least 4.5:1. The frame's highest contrast sits in the corners so the eye is framed, not distracted.
