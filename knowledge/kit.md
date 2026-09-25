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
- `random(seed)` gives identical scatter in every frame and export; never use `Math.random`.
- `threeStage({ environment: 'studio' })` lights like product photography (dark surroundings, softboxes): facets and metal alternate dark and bright. `'room'` is soft and bright for plastic and cloth.
- For gems, avoid transmission on a transparent canvas (it washes out); use a deep base color, clearcoat, strong environment and a warm inner light.

## Mockups
An HTML mockup can embed other HTML assets with `<iframe src="btn-play.html" scrolling="no">` (sized to the asset) and SVG assets with `<img>`; the kit's `.g-label` stands in for engine text.
