# Meadow Farm - Art Bible

## Direction
Cozy farming life sim for mobile. Warm, handmade, gentle. The UI feels like painted wood signs, stitched cloth and sun-warmed paper found around a small farm: slightly irregular shapes, soft painted shading, dark wood outlines with a faint hand-drawn wobble. Friendly and readable first; never glossy or neon.

## Targets
Portrait 1080×1920, authored at 1x, exported @1x and @2x. Primary buttons ~400×140, icons 128×128, bars 360×64.

## Light
Late-afternoon sun from the top-left, warm (yellow) light, cool-green shadows on greens and warm-brown shadows on wood. Soft drop shadows straight down, #3a2414 at 30%.

## Palette
- Honey wood: #3a2414 #5c3a1e #8a5a2e #b98347 #dcae6e #f3d9a4
- Leaf green (primary action): #1f3d1c #2f5e27 #4a8a36 #74b44f #a8d77a #d9f0b0
- Cream paper: #6b5a45 #a8916f #d8c39c #efe1c2 #fbf4e3
- Berry (alerts, carrots, hearts): #5c1620 #9b2e30 #d0543f #f08a5d #f7b98f
- Sun gold (coins, rewards): #6e4310 #b5791f #e8b341 #fbe08a #fff6d0
- Water blue: #1d3b57 #2f6a8f #58a0c4 #9fd3e8 #d6eff7
- White for tiny speculars only: #ffffff
60/30/10: wood and paper dominate, leaf green supports and marks the primary action, berry and gold are accents.

## Materials
Painted wood (grain lines following the plank, darker at plank ends, nail heads), cotton cloth (stitched dashed borders), paper (warm, fibrous, soft edges), soft vegetables and metal only for tools (watering can: painted tin, not chrome).

## Shape language and ornament
Rounded rectangles with slightly uneven edges, chunky and soft. Ornament: leaf sprigs, nails, stitches, small flowers; only in corners. No sharp spikes.

## Line and edges
Outline #3a2414, 3px at 1x on UI, 2.5px on icons, with a subtle wobble (turbulence displacement scale 1.5). Inner lines one ramp step darker than the fill, not outline color.

## UI kit rules
Corner radius family 12/20/32. Wooden lip 8px under buttons. Pressed: face down 6px, lip 2px. Disabled: paper ramp, desaturated. Labels are engine-rendered #fbf4e3 with #3a2414 outline, so faces keep a calm mid-dark center. 9-slice insets sit just past corner ornaments.

## Icons
128×128, slight 3/4 view, 2.5px outline, one soft highlight, no frame (slots are separate UI).

## VFX
Warm sparkles and leaves: gold #fbe08a core, leaf green bits, soft pops with overshoot, 0.6-0.9s.

## Don'ts
Glossy candy gloss, neon, pure black, sci-fi chamfers, heavy grime, glow on everything, text baked into UI.
