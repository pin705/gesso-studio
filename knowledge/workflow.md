# Production workflow

This is how a professional game artist works. Follow the order; skipping the early steps is what makes AI art look generic.

## 0. Brief
Know before drawing: genre and mood, platform and reference resolution (e.g. 1920×1080 PC, 1080×1920 portrait mobile), where the asset appears and at what on-screen size, and which states or variants the game needs. If the user has not said, ask at most three short questions or pick sensible defaults and state them.

## 1. Art bible first
Every project has one `STYLE.md` (see `art-bible`). If it is missing, read the closest `styles/*` pack, adapt it to the game, show the user the direction in two or three sentences, then `write_art_bible`. All assets obey it: palette ramps, light direction, materials, shape language, line and edge rules, UI kit rules. Consistency across a set matters more than any single pretty asset.

## 2. Plan the asset
Read its `asset-types/*` guide. Decide canvas size (1x pixels at the reference resolution), padding, 9-slice insets, states, and the one focal point. Name ids with the asset id as prefix.

## 3. Block-in (silhouette and values)
Flat shapes only, three values (light, mid, dark), no effects. `save_asset` and check the review sheet: the 64px and 32px previews must read instantly, and the grayscale view must separate the main parts. Fix big shapes now; details never rescue a weak silhouette.

## 4. Form and material
Add the light: lit planes, core shadow, occlusion in crevices and under overhangs, highlights and rim or bounce light (`fundamentals/light-value`). Render each material with its recipe (`fundamentals/materials`). Colors come from the art bible ramps with hue shifting (`fundamentals/color`).

## 5. Detail and polish
Spend detail where the eye should land (the focal area gets the highest contrast and sharpest edges), keep rest areas calm. Add edge highlights, specular pops, restrained texture, ornament that follows the structure. Effects such as glow and blur are seasoning: a few places, never everywhere.

## 6. Critique loop
Score the review sheet with `critique`. Fix the weakest dimension, save again, repeat. Expect three or four passes; stop only when every dimension scores 4 or more. Tell the user what you changed between passes in one line each.

## 6b. Feedback from the user
The user reviews in the Gesso studio: approve, request changes, or pin comments on the art. Call `get_feedback` at the start of a session and after each round, fix every open item, then `resolve_feedback` with a one-line reply saying what changed. Treat a pinned point as the exact spot to fix.

## 7. Set consistency
When an asset belongs to a set (a button family, an icon row, a UI kit), `view_assets` the whole set: same light direction, outline weight, bevel size, corner radius family, palette and level of detail.

## 8. Variants and export
Build states and variants from the approved master (`read_asset`, then edit), never from scratch, so they stay consistent. `export_assets` only after the user approves.

## Non-negotiables
- Transparent canvas. No presentation backgrounds, captions, watermarks, seed labels or decorative scenery around the asset.
- UI chrome is textless; the engine renders localized labels. Leave a calm label zone.
- One light direction per project (default: top-left, about 45°).
- Never invent colors outside the art bible without saying so and updating it.
- Author at 1x on a pixel grid; export @2x for high-DPI.
