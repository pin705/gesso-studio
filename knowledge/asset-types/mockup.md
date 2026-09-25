# Screen mockups

A mockup puts the kit together the way the player will see it: bars inside their frames, labels on buttons, icons in slots, all on a representative game background. It is how an art director judges a set, and it catches problems single assets hide (contrast against the scene, scale mismatches, two accents fighting).

## How to build one
- `data-type="mockup"`, canvas at the reference resolution or a crop of it (e.g. 960×540 for a 1920×1080 HUD corner).
- Place real assets with `<image href="orb-health.frame.svg" x="…" y="…" width="…" height="…"/>`, relative to the assets folder. Layer fills under frames, simulate states (a bar at 65%) with a `clipPath` over the fill.
- Add a simple background that stands in for gameplay (blurred shapes, the level's dominant colors), sample labels in the engine font style, and nothing else.
- Mockups are never exported for the engine; they exist for review.

## What to check
- The primary action is the first thing the eye finds; HUD elements do not compete with the play area.
- Every asset shares the same light direction, outline weight and palette at its real on-screen size.
- Text sits in the label zones with the art bible's label color and stays readable.
