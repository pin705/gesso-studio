# Bars: health, mana, XP, progress, cast

## Deliverables (separate files so the engine can animate the fill)
- `bar-x.frame`: the housing, 3-slice or 9-slice (`data-nine-slice`), with a recessed track.
- `bar-x.fill`: the fill, stretchable horizontally: shading only across the short axis (vertical gradient, top highlight band, bottom shade). No detail that breaks when stretched.
- Optional: `bar-x.back` (empty track or damage-trail layer), `bar-x.cap` (glowing leading edge), `bar-x.ticks` (segment overlay).

## Look
- The track is recessed: inner shadow at its top, darker than the frame.
- The fill is the brightest element and uses semantic color: health red or green, mana blue, energy yellow, XP purple or gold. Make its light top band and darker bottom follow the art bible's light.
- Frame end caps carry the ornament; the long edges stay plain for stretching.
- Height at 1x: HUD bars 16-32px, boss bars 32-48px, include padding for glow.
