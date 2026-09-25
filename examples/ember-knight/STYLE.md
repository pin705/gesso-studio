# Ember Knight - Art Bible

## Direction
Top-down pixel roguelike for PC and Switch. Chunky, readable, warm light in cold stone. Built from the pixel style pack.

## Targets
640×360 reference, integer-scaled to 1920×1080 (@3x). 4px grid at 1x for UI chrome; 16×16 sprites drawn 4x (64×64) for icons.

## Light
Top-left. Every shape gets a 1-pixel highlight on its top-left edge and a 1-pixel shadow on its bottom-right edge.

## Palette
Sweetie 16, nothing else:
#1a1c2c #5d275d #b13e53 #ef7d57 #ffcd75 #a7f070 #38b764 #257179 #29366f #3b5dc9 #41a6f6 #73eff7 #f4f4f4 #94b0c2 #566c86 #333c57

## Materials
Flat pixel color with stepped bevels; no gradients, no blur, no anti-aliasing.

## Shape language
Rectangles on the grid, stepped corners, one-pixel outlines in #1a1c2c.

## UI kit rules
Outline 4px (one art pixel) #1a1c2c; bevel 4px light top-left, 4px dark bottom-right; buttons have an 8px lip. Text in Press Start 2P at 12px, or Pixelify Sans for body.

## Icons
16×16 sprites: outline, shadow, base, light and one highlight pixel, from the icon's own ramp.

## VFX
Pixel sparks and flashes on the same grid; no smooth glows.

## Don'ts
Gradients, soft shadows, sub-pixel positions, colors outside Sweetie 16.
