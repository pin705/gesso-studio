# Critique rubric

Score every review sheet honestly on each dimension (1 = broken, 3 = passable, 5 = shippable in a commercial game). Write the scores, name the weakest dimension, fix it, save again. Done means every score is 4 or more.

| Dimension | 5 looks like | Check on the review sheet |
| --- | --- | --- |
| Readability | Recognizable in a blink at display size; clean silhouette with purposeful negative space | 64px and 32px previews; would a player identify it in combat or in a crowded HUD? |
| Value structure | Clear light/mid/dark grouping; focal point has the strongest contrast; parts separate in grayscale | Grayscale panel: squint. Mud or equal values mean a fail. |
| Form and light | One consistent light direction; forms turn with core shadow, occlusion and highlight; objects feel solid | Where is the light? Are all parts lit from the same side? |
| Material | Each material is identifiable by its value range, edge sharpness and highlight shape | Could you tell gold from brass, jade from glass, iron from steel? |
| Color | Art bible ramps; hue-shifted shadows and highlights; saturation controlled; accents reserved for meaning | Any off-palette warnings? Any neon where nothing emits light? |
| Craft | Clean edges, aligned parts, no gaps or overlaps, consistent line weights, no clipped effects | Zoom into the render: stray points, broken joins, clipping at canvas edges. |
| Game fitness | Right size, padding, states, 9-slice-safe, textless chrome, transparent canvas, engine-ready | Lint output; could a developer drop it into the game today? |

## Anti-slop checklist
These are the tells of generic AI or programmer art. Any one of them caps the score at 3.
- Glow, bloom or blur on most elements ("neon soup"). Emissive light only where something emits light.
- A single top-to-bottom gradient as the only shading, on every shape.
- Pure black shadows or pure white highlights everywhere; gray, desaturated shading.
- Uniform 1px black outlines around everything.
- Random decoration: floating dots, splatter, sparkles, particles or mist that are not part of the design.
- Presentation-card output: background scenery, captions, UI labels, seeds or version text baked into the asset.
- Clip-art symbols (generic star, generic sparkle, emoji-like icons) standing in for a designed motif.
- Everything centered, symmetric and equally sized; no big/medium/small rhythm.
- Detail spread evenly across the whole asset instead of concentrated at the focal point.
- Mixed light directions between parts or between assets in a set.
- Noise or texture filter over the whole image instead of on specific materials.
- Ornaments floating unattached instead of growing from the structure.
- Text or rune glyphs overlapping other shapes without intention.
- Style drift: shapes, colors or line work that belong to a different genre than the art bible.
