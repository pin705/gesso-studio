# Writing the art bible (STYLE.md)

The art bible is the project's contract, like a design system for games. It must be specific enough that two artists would produce matching assets. Start from the closest `styles/*` pack, then make decisions for this game; name them, do not just copy the pack. Hex codes listed in STYLE.md become the palette that `save_asset` lints against, so list every color you intend to use, as ramps.

Keep it to about one page. Use this template:

```markdown
# <Game title> - Art Bible

## Direction
Genre, mood and three adjectives (e.g. "serene, precious, misty"). One paragraph describing the look in visual terms; references described by their qualities, not copied.

## Targets
Reference resolution and orientation, UI scale, platform, authoring scale (1x) and export scales.

## Light
Key light direction and elevation, light color temperature, shadow color family, rim or bounce rules.

## Palette
Ramps from darkest to lightest, 4-6 steps each, with roles:
- Primary material (e.g. jade): #0e3b36 #16574d #1f7a67 #3fa287 #7fcfb0 #cdeee0
- Trim metal: ...
- Accent (CTA / rarity / danger): ...
- Neutrals: ...
- Emissive (only for light-emitting things): ...
60/30/10 split: which ramp dominates, which supports, which accents.

## Materials
The few materials this game uses and how each is rendered here (reference `fundamentals/materials`, note the tweaks).

## Shape language and ornament
Dominant shapes and why, corner treatment, ornament motifs and where they may appear.

## Line and edges
Outline or no outline, outline color rule, weights at 1x, edge sharpness rules, bevel size.

## UI kit rules
Corner radius family, bevel depth, drop shadow (offset, blur, color, opacity), 9-slice conventions, label zone and label color the engine will use, button state logic.

## Icons
Canvas size, view angle, outline, frame or no frame, rarity treatment.

## VFX
Color logic (core to edge), timing feel, blend assumptions, particle shapes.

## Don'ts
Five to eight style-specific things to avoid.
```
