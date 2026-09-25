# Icons

## Kinds
- **Item icons** (weapons, potions, loot, currency): the object alone on a transparent canvas; rarity frames and slot backgrounds are separate UI assets.
- **Skill or ability icons**: a full-bleed square illustration (background included) that the UI frames; strong central motif, high contrast.
- **Status and system icons** (buffs, settings, map markers): simple glyphs, one or two colors, flat or lightly shaded, readable at 24-32px.

## Canvas
- Author items and skills at 128×128 or 256×256 (1x). Content fills about 80-90% of the box; keep at least 4-8px padding for outline and glow.
- Check the 64px and 32px previews every pass: the silhouette and the one focal detail must survive.

## Rules
- One object, one idea, one focal point.
- Readable silhouette first; a 2-3px outline (darkest local step or the art bible's outline color) keeps icons readable on any slot color.
- Light top-left, consistent across the whole icon set. Same view angle (usually slight 3/4 for objects), same outline weight, same level of detail.
- Long objects diagonal (bottom-left to top-right), round objects upright or slightly tilted.
- Exaggerate the identifying feature (a potion's liquid, a sword's edge, a gem's facets); drop details that disappear at 64px.
- Set consistency beats individual beauty: `view_assets` the whole row before calling it done.
