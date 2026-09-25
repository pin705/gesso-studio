# Critique rubric

Score every review sheet honestly on each dimension (1 = broken, 3 = passable, 5 = shippable in a commercial game). Write the scores, name the weakest dimension, fix it, save again. Aim for 4 on every dimension. If a score is still 3 after two passes, stop and tell the user what would lift it (a different technique, a reference, more time) instead of looping or rounding up.

## Anchors
`read_guide(["critique"])` returns anchor sheets with real assets placed at 2, 3 and 4 for UI chrome, icons and VFX. Score against them, not against your intent:
- **2, reject:** hand-typed SVG look. Flat fills, one gradient, thin uniform strokes, clip-art motifs, glow everywhere.
- **3, passable prototype:** readable and has a material, but generic shapes, gradient shading, texture that reads as noise.
- **4, good:** instant read at 32 px, a material you can name, one light direction, clean construction, states and 9-slice safe.
- **5, shippable:** it would sit unnoticed next to a shipped commercial game in the same genre. Reference bar per genre:
  cozy `Stardew Valley`, dark-fantasy `Darkest Dungeon / Hades`, heroic-fantasy `World of Warcraft`, sci-fi `Dead Space`, casual `Candy Crush Saga`, xianxia `Gujian 3`, pixel `Dead Cells`. None of the anchors is a 5 yet.

## Hard gates
Scores are capped by facts, whatever the render looks like to you:
- **Beat the anchor.** To give a 4 on any dimension, name the anchor it matches or beats and say how. No anchor for the asset type at 4 yet? Then the cap is 3 unless you can name the commercial game it would fit into.
- **A 5 needs a reference.** Name the shipped game and the asset it would sit beside. Without one, 4 is the cap.
- **Lint warnings cap Game fitness at 3** until they are fixed or explained in the note (e.g. deliberate full bleed).
- **Any anti-slop tell caps every dimension at 3** (list below).
- **Readability is judged at 32 px**, not at full size: if the silhouette blurs into a blob there, Readability is 2.
- **Figurative art drawn as hand-typed paths** (creatures, characters, detailed items) caps Form and Material at 3. Use a silhouette, the kit or three.js.
- **Average is not the score.** Report each dimension; the asset is as good as its lowest one.

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
