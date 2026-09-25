# The Gesso Kit

Do not hand-type complex vector paths. Build assets as small HTML documents on the Gesso Kit: CSS materials, self-hosted game fonts, 4000+ professional silhouettes, and browser builds of Pixi and three.js. Gesso renders them in Chromium exactly like SVG assets: same review sheet, lint, history and export.

## Document skeleton
```html
<!doctype html>
<html data-type="button" data-width="400" data-height="156" data-style="cozy-farm" data-nine-slice="44 72 50 96">
<head>
  <link rel="stylesheet" href="/kit/gesso.css">
  <style>:root { --outline: #3a2414; --ow: 3px; }</style>
</head>
<body><div class="g-canvas">
  <!-- parts, absolutely positioned inside the 1x canvas -->
</div></body>
</html>
```
- `data-width`/`data-height` are the 1x canvas. The page background stays transparent.
- Animated assets add `data-duration` (seconds) and optionally `data-frames`.
- Everything must be local: `/kit/…` and sibling files only. The network is blocked.

## Materials
Put a material class on any box: `g-mat-paint` (any ramp), `g-mat-wood`, `g-mat-painted` (paint over wood), `g-mat-gold`, `g-mat-steel`, `g-mat-iron` (hammered), `g-mat-stone`, `g-mat-jade`, `g-mat-paper`, `g-mat-leather`, `g-mat-candy`, `g-mat-lacquer`, `g-mat-glass`, `g-mat-holo`, `g-mat-energy`.
Every material reads a ramp, darkest to lightest: `--c1 … --c5` (`--c6` for metals). Set it from the art bible on the element or any ancestor:
```html
<div class="g-mat-paint" style="--c1:#1f3d1c;--c2:#2f5e27;--c3:#4a8a36;--c4:#74b44f;--c5:#a8d77a"></div>
```
Lighting and structure helpers: `g-outline`, `g-lip`, `g-drop`, `g-gloss`, `g-spark`, `g-well` (recessed), `g-stitch`, `g-rivets`, `g-chamfer` (`--cut`), `g-pill`, `g-round`. Tokens: `--outline`, `--ow` (outline width), `--lip`, `--radius`, `--shadow`.

## Components
```html
<!-- button: outline + lip around a material face; add is-pressed / is-disabled for states -->
<div class="g-button" style="--c1:…;--lip:10px;--radius:30px"><div class="g-button__face g-mat-candy g-gloss"></div></div>

<!-- panel: frame material around a content well; --frame is the frame width -->
<div class="g-panel g-mat-wood" style="--frame:24px"><div class="g-panel__content g-mat-paper"></div></div>

<!-- bar: a track (g-well) plus a fill; export the fill as its own asset -->
<div class="g-bar__track g-well" style="left:60px;right:20px;top:20px;bottom:22px"></div>
```

## Genre templates
Don't start UI chrome from a blank page. `get_template` returns ready parts for each genre: `cozy`, `dark-fantasy`, `heroic-fantasy`, `sci-fi`, `casual`, `xianxia` and `pixel`, each with `button` (pressed and disabled states), `panel` (9-slice), `bar-frame`, `bar-fill` and `slot`.
1. `get_template({ genre })` for the closest genre, then pick the parts you need.
2. Replace the ramps in its `:root` style with the art bible's hex codes, and change the silhouette ornaments to the game's motifs.
3. Save it under your own id. For states, save the same document with `class="is-pressed"` or `class="is-disabled"` on `<body>` as `btn-play.pressed` and `btn-play.disabled`.
4. Keep the bar fill the same size as the frame's track, so the engine can place it at the track's offset.
Templates also link `/kit/templates.css`: `t-nail` (nail or rivet head), `t-gem` (cut gem cap), `t-shine` (glossy top), `t-segments` (segmented fill), `t-pixel` and `t-pixel-outline` (pixel bevel and outline).

## Icons from silhouettes
Never draw a sword, potion or creature by hand. `search_icons` finds a professional silhouette (game-icons, CC BY 3.0), then the kit renders it with a material, outline, form shading, rim light and edge shadow:
```html
<div class="g-icon" style="--icon:url(/kit/icons/game-icons/broadsword.svg); --pad:10px">
  <i class="g-icon__base g-mat-steel"></i>
  <i class="g-icon__shade"></i>   <!-- darker toward the bottom-right -->
  <i class="g-icon__rim"></i>     <!-- lit top-left edge (shape minus shape shifted) -->
  <i class="g-icon__edge"></i>    <!-- shadow edge -->
</div>
```
- **Several colors on one silhouette** (a carrot's orange body and green leaves): add a second `g-icon__base` with its own ramp and a `clip-path` over that region. Check the render to see where the region really is.
- Silhouettes are flat glyphs: great for skills, buffs, currency, UI symbols and weapons; for rich item art, layer parts (a gem in a setting, a label on a bottle) or render it in 3D.
- Credit game-icons.net (CC BY 3.0) in the game's credits; the export manifest lists the icons used.

## Type
Fonts are self-hosted: set `--font` on `.g-title` (gradient face, outline, extrusion) or `.g-label` (engine-style label for mockups).

| Genre | Display | Label / body |
| --- | --- | --- |
| Dark fantasy | Grenze Gotisch, Cinzel | Cinzel |
| Heroic fantasy | Cinzel Decorative, Cinzel | Fredoka |
| Cozy / storybook | Fredoka, Macondo | Fredoka, Baloo 2 |
| Casual mobile | Lilita One, Luckiest Guy | Baloo 2, Fredoka |
| Sci-fi | Orbitron | Rajdhani |
| Pixel | Press Start 2P, Pixelify Sans | Pixelify Sans |
| Xianxia | Ma Shan Zheng | Cinzel |

## Scripted assets: Pixi (VFX) and three.js (rendered 3D)
Use Pixi for particles, bloom, glow and shock waves; use three.js for gems, coins, orbs, potions and metal that should look rendered. Gesso drives time: build the scene once in `setup`, draw frame `t` deterministically in `render`.
```html
<script type="module">
  import { defineAsset, pixiStage, threeStage, random, ease } from '/kit/gesso.mjs';
  defineAsset({
    async setup() {
      const { PIXI, app } = await pixiStage();
      // build sprites, graphics, filters (GlowFilter, AdvancedBloomFilter, ShockwaveFilter…)
      return { PIXI, app };
    },
    render(t, { app }) {
      // position everything from t only (no accumulated state), then:
      app.render();
    }
  });
</script>
```
### VFX recipes (`/kit/vfx.mjs`)
Each recipe returns a `{ setup, render }` pair; pass it straight to `defineAsset`. Colors are hex numbers from the art bible.
```html
<html data-type="vfx" data-width="256" data-height="256" data-duration="1" data-frames="16" data-bleed>
<script type="module">
  import { defineAsset } from '/kit/gesso.mjs';
  import { flame } from '/kit/vfx.mjs';
  defineAsset(flame({ stops: [[0, 0xfff4c8], [0.2, 0xffc23a], [0.45, 0xff6a1a], [0.75, 0xb3201a], [1, 0x2a1410]] }));
</script>
```
| Recipe | Use | Main options |
| --- | --- | --- |
| `slash` | melee swing: tapered crescent, sparks off the edge | `core`, `color`, `edge`, `radius`, `sweep`, `start`, `thickness`, `sparks` |
| `burst` | spell cast or explosion: rays in three lengths, ring, rune | `core`, `color`, `edge`, `rays`, `sparks`, `runes` |
| `flame` | looping fire: nested tongues, detached licks, embers | `stops` (hot to cool), `embers`, `width`, `height` |
| `aura` | looping buff, heal or shield on the ground | `core`, `color`, `edge`, `motes` |
| `hit` | short impact: star flash, shock ring, streaks | `core`, `color`, `edge`, `streaks` |
| `projectile` | traveling bolt: bright head, fading trail, arrival flash (lays along x) | `core`, `color`, `edge`, `trail` |
Recipes are a starting point. When one is not enough, copy its code from `/kit/vfx.mjs` into the asset and change the shapes.

### Rendered items (`/kit/items.mjs`)
three.js presets lit for the studio environment. Each returns a group about 2 units tall:
```html
<script type="module">
  import { defineAsset, threeStage } from '/kit/gesso.mjs';
  import { gem, coin, potion } from '/kit/items.mjs';
  defineAsset({
    async setup() {
      const stage = await threeStage();
      stage.scene.add(gem(stage.THREE, { color: 0x1a7a3a, cut: 'oval' }));
      return stage;
    },
    render(t, stage) { stage.render(); }
  });
</script>
```
- `gem(THREE, { color, cut: 'round' | 'oval', glow })`: faceted brilliant cut.
- `await coin(THREE, { color, emblem, roughness })`: rim and embossed emblem; `emblem` is a silhouette URL such as `/kit/icons/game-icons/crown.svg`.
- `potion(THREE, { liquid, glow, level, glass, cork })`: round flask with glowing liquid.
- `orb(THREE, { liquid, glow, glass, base })`: HUD orb — glass sphere, glowing liquid core, iron base ring. For health/mana orbs.
- Item icons get the project outline with a filter on the canvas: `canvas { filter: drop-shadow(2.5px 0 0 #0b0d10) drop-shadow(-2.5px 0 0 #0b0d10) drop-shadow(0 2.5px 0 #0b0d10) drop-shadow(0 -2.5px 0 #0b0d10); }`.
- A still (no `data-duration`) is rendered once, then swapped for an image so its WebGL context is freed. A page gets about 16 live contexts, so this is what lets a mockup embed many rendered items. Each item still costs a second or two to render, so keep a mockup to about 30.

### Pixel icons
`pixelIcon()` samples a silhouette onto a small grid and shades it like hand-placed pixels: outline, shadow edge, base, lit edge, one highlight.
```html
<html data-type="icon" data-width="72" data-height="72" data-style="pixel">
<script type="module">
  import { defineAsset, pixelIcon } from '/kit/gesso.mjs';
  defineAsset({ setup: () => pixelIcon({ icon: '/kit/icons/game-icons/hearts.svg', grid: 16, ramp: ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75'] }) });
</script>
```
Pick bold, solid silhouettes (hearts, potion-ball, two-coins, broadsword, key). Line-art silhouettes and ones with thin inner cuts turn into noise at 16 px. A 72 px canvas holds a 16×16 sprite at 4x with 4 px of padding.

### Rules for scripted assets
- `random(seed)` gives identical scatter in every frame and export; never use `Math.random`.
- `threeStage({ environment: 'studio' })` lights like product photography (dark surroundings, softboxes): facets and metal alternate dark and bright. `'room'` is soft and bright for plastic and cloth.
- For gems, avoid transmission on a transparent canvas (it washes out); use a deep base color, clearcoat, strong environment and a warm inner light.

## Mockups
An HTML mockup can embed other HTML assets with `<iframe src="btn-play.html" scrolling="no">` (sized to the asset) and SVG assets with `<img>`; the kit's `.g-label` stands in for engine text.
