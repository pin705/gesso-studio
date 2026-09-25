# Light and value

Value (lightness) carries readability; color only decorates it. Most "flat" or "cheap" looking assets fail here, not in color.

## One light, everywhere
- Default key light: top-left, about 45° elevation. Every asset in the project uses the same direction, stated in STYLE.md.
- Lit planes face up and left; shadow planes face down and right. Bevels: top and left lips light, bottom and right lips dark.
- Cast and drop shadows fall down (and slightly right). UI drop shadows are soft, offset 2-8px down, colored with a dark, slightly saturated version of the background hue, 25-45% opacity. Never pure black at full strength.

## Value structure
- Block in with three values (light, mid, dark) and check the grayscale panel: the main parts must separate. Final assets use 5-7 value steps per material.
- Keep one dominant value family (usually mid or dark for UI) and let the focal point break it with the strongest light-dark contrast.
- Compress values in rest areas and backgrounds (low contrast), expand them at the focal point.
- Squint test: in the grayscale panel, if you cannot find the focal point in half a second, the value hierarchy is wrong.

## Anatomy of a lit form
From light to dark, every solid form shows:
1. **Specular highlight**: small, sharp, the brightest spot; shape depends on the material (tight dot for polished, broad soft band for satin).
2. **Light**: the planes facing the light, local color at its most saturated in the half-light.
3. **Halftone**: planes turning away; the form turns here.
4. **Core shadow (terminator)**: the darkest band of the form shadow, just past the turn. Missing core shadows make forms look like stickers.
5. **Reflected (bounce) light**: a subtle lift inside the shadow near the edge, tinted by the environment. Never brighter than the halftone.
6. **Occlusion**: the darkest darks, in crevices, contact points and under overhangs (where a gem sits in its setting, where a blade meets its guard).
7. **Cast shadow**: sharp near contact, softer as it travels.

## Building light in SVG
Layer shapes instead of relying on one gradient:
1. Base fill in the local mid value.
2. Shadow shapes: paths following the form's turn, clipped to the silhouette (`clipPath`), darker and hue-shifted cooler; soften with a gradient or a small blur only on the turning edge.
3. Occlusion lines and pockets at joints.
4. Light shapes on the lit planes, warmer and lighter.
5. Edge highlights: thin bright strokes on edges facing the light (1-2px at 1x).
6. Specular pops: one to three small shapes, at most, at the focal point.
7. Rim or bounce light on the shadow side, low contrast.

## Edges
Hard edges attract the eye; soft edges recede. Use hard edges on the focal point and on cast shadows near contact, soft edges on turning forms and distant parts. A mix of hard and soft edges is what makes vector art feel painted rather than plotted.
