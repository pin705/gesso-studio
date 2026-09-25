# Game Art Studio

**Procedural game-asset authoring prototype** — a small, local-first editor for building high-quality 2D game art from declarative primitives instead of raster AI images.

The demo is intentionally art-led: it opens on a carved xianxia jade button, with a real inspector, deterministic procedural controls, a looping VFX timeline, JSON/SVG/raster export, and a PixiJS runtime preview.

## Run it

```bash
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`).

```bash
npm run check   # Svelte + TypeScript diagnostics
npm run build   # production bundle
npm run preview # serve the production bundle
```

No backend, account, API key, or asset download is required. All visible art is generated from SVG geometry, gradients, filters, particles, and deterministic noise.

## Demo path

1. Open the app and inspect the **Jade button** in the center artboard.
2. Click a material swatch such as **Gold**, **Iron**, or **Spirit Energy** in the Inspector.
3. Change **Rarity**, **Edge roughness**, **Inner glow**, **Seed**, or **Display label**.
4. Click **VFX** in the top bar or choose **Sword slash** from the library.
5. Press the timeline play button and scrub the playhead. The slash, ink, glow, and particles are evaluated from explicit time values.
6. Use **Procedural Variation** to open generated sword variants from one recipe.
7. Click **Export Asset** for SVG, PNG, WebP, JSON, a six-frame sprite sheet, or a Pixi manifest.
8. Click **Pixi Runtime** to render the same `AssetDefinition` through PixiJS/WebGL.

## What is implemented

- **Declarative scene model** — `AssetDefinition` contains serializable `SceneNode` primitives, materials, effects, parameters, and a seed.
- **11 editable templates** — jade button, gold button, cultivation panel, skill icon, item icon, legendary badge, sword slash, magic circle, ink smoke, progress bar, and moon sword.
- **Procedural primitives** — rounded rectangles, circles, ellipses, polygons, stars, paths, lines, arcs, text, groups, and particles.
- **SVG renderer** — solid/linear/radial paints, opacity, blend modes, strokes, dashes, roughening, paper, mist, glow, shadow, blur, and selection overlays.
- **Shui-mo / ink engine** — seeded rough brush paths, ink strokes, splashes, clouds, and ornamental borders.
- **Material system** — Jade, Gold, Iron, Paper, Ink, Fire, Ice, Lightning, and Spirit Energy.
- **Particle presets** — spark, dust, ink, fire, spirit, magic, leaf, and snow.
- **Timeline** — play/pause/restart, FPS selector, scrubbing, deterministic loop, keyframe visualization, and path-progress animation.
- **Variation system** — one sword definition generates blade/guard/ornament/rarity combinations.
- **Export adapters** — SVG, PNG, WebP, JSON, sprite sheet, and Pixi-compatible manifest.
- **PixiJS runtime** — `createPixiAsset(asset)` creates a playable `Container` from the same plain scene data.
- **AI-ready boundary** — the model is JSON-safe and has no callbacks, DOM nodes, or Pixi objects in the asset document.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the renderer/runtime boundary and extension recipe.

```text
src/
├── assets/
│   ├── common.ts                # artboard helpers, material paints, ornaments
│   ├── buttons.ts               # jade/gold button generators
│   ├── panel.ts                 # cultivation panel generator
│   ├── icons.ts                 # icon, badge, magic circle, progress generators
│   ├── vfx.ts                   # slash, smoke, sword variants
│   ├── components.ts            # reusable component factory API
│   └── index.ts                 # template catalog + buildAsset()
├── primitives/
│   ├── path.ts                  # seeded random + path/stroke helpers
│   ├── shapes.ts                # rect/circle/polygon/star/arc factories
│   ├── materials.ts             # parameterized materials
│   ├── particles.ts             # deterministic particle presets
│   └── ink.ts                   # ink border/stroke/splash/cloud helpers
├── renderer/
│   ├── svg.ts                   # declarative scene → SVG string
│   └── pixi.ts                  # declarative scene → Pixi Container
├── export/exporter.ts           # local download and raster/sprite adapters
├── effects/index.ts             # stable ink/glow/particle effect API
├── timeline/index.ts             # keyframes + easing helpers
├── ai/intent.ts                  # constrained model-facing intent boundary
├── types/scene.ts               # serializable schema types
├── components/                  # editor thumbnails, icons, Pixi modal
├── App.svelte                   # current prototype shell
└── styles/app.css               # game-editor visual system
```

The important boundary is:

```text
AssetControlState → buildAsset() → AssetDefinition
                                  ├─ SVG editor / export
                                  ├─ PixiJS runtime
                                  └─ JSON manifest / future AI input
```

`AssetDefinition` contains no Pixi instances, DOM references, callbacks, or mutable runtime state. That keeps the editor scene, export pipeline, and future server/AI tooling independent.

## Scene schema

The current schema is intentionally small and JSON-safe:

```json
{
  "type": "game-asset",
  "id": "jade-button",
  "name": "Jade breakthrough button",
  "width": 720,
  "height": 480,
  "seed": 4817,
  "version": 1,
  "parameters": {
    "material": "jade",
    "rarity": "legendary",
    "label": "突破",
    "roughness": 0.42,
    "glow": 0.58
  },
  "nodes": [
    {
      "id": "jade-button-shell",
      "type": "group",
      "x": 119,
      "y": 145,
      "children": [
        {
          "id": "button-jade-body",
          "type": "rounded-rect",
          "width": 468,
          "height": 160,
          "radius": 20,
          "fill": {
            "kind": "linear",
            "stops": [
              { "offset": 0, "color": "#b9f0cf", "opacity": 0.76 },
              { "offset": 0.54, "color": "#1d776c" },
              { "offset": 1, "color": "#092c32" }
            ]
          },
          "effects": ["inner-bevel", "rough", "soft-shadow"]
        }
      ]
    }
  ]
}
```

Supported node families are `group`, `rect`, `rounded-rect`, `circle`, `ellipse`, `line`, `polygon`, `star`, `path`, `arc`, `text`, and `particle`. Paints can be a color string, linear gradient, or radial gradient.

## Component API

Reusable factories live in `src/assets/components.ts`:

```ts
import { GameButton, SkillIcon, Sword, Slash, ParticleField } from './src/assets/components';

const button = GameButton({ material: 'jade', rarity: 'legendary', label: '突破' });
const icon = SkillIcon({ element: 'spirit', rarity: 'epic' });
const sword = Sword({ material: 'jade', rarity: 'legendary' });
const slash = Slash({ element: 'fire', particleCount: 64 });
const particles = ParticleField('spirit', { count: 32, seed: 12 });
```

## Determinism

Every procedural generator uses a numeric seed. A seed is threaded through path roughening, particles, ink splashes, texture displacement, and variation generation.

```ts
import { DEFAULT_CONTROLS, buildAsset } from './src/assets';

const first = buildAsset('sword-slash', { ...DEFAULT_CONTROLS, seed: 4817 }, 0.72);
const second = buildAsset('sword-slash', { ...DEFAULT_CONTROLS, seed: 4817 }, 0.72);

// The generated geometry and particle positions are reproducible.
```

Animation is also stateless: the VFX generator receives `time` and calculates positions from that value. Scrubbing backward produces the same frame as playing forward.

## Export API

The browser adapters live in `src/export/exporter.ts`:

```ts
import {
  exportSVG,
  exportPNG,
  exportWebP,
  exportJSON,
  exportSpriteSheet,
  exportPixiDefinition,
  exportAsset
} from './src/export/exporter';

await exportAsset('sword-slash', { format: 'pixijs', controls, time: 0.72 });
exportSVG(asset, { time: 0.72, transparent: false });
await exportPNG(asset, { time: 0.72, scale: 2 });
await exportWebP(asset, { time: 0.72, scale: 2 });
exportJSON(asset, controls);
await exportSpriteSheet('sword-slash', controls, { scale: 1 });
exportPixiDefinition(asset, controls);
```

Raster exports render the authored SVG into a dedicated canvas, so viewport zoom, selection guides, and the editor UI are not baked into the output. Downloads are generated locally with `Blob` and object URLs.

## PixiJS runtime

The Pixi adapter consumes the same plain `AssetDefinition` as the SVG renderer:

```ts
import { Application } from 'pixi.js';
import { buildAsset, DEFAULT_CONTROLS } from './src/assets';
import { createPixiAsset } from './src/renderer/pixi';

const app = new Application();
await app.init({ width: 720, height: 480, background: '#0a1015' });

const asset = createPixiAsset(
  buildAsset('sword-slash', DEFAULT_CONTROLS, 0.72),
  { duration: 2.8 }
);

app.stage.addChild(asset);
asset.position.set(500, 300);
asset.play();

// Later:
asset.pause();
asset.setTime(1.2);
```

The editor uses SVG because it gives the prototype crisp selection, rich filters, and fast authoring feedback. The Pixi adapter is the runtime boundary for a future game build. Both consume the same geometry/material/effect data; neither renderer owns the document.

## Adding a new primitive

1. Add the node variant to `NodeType` in `src/types/scene.ts`.
2. Add a pure geometry helper in `src/primitives/path.ts` or a new primitive module.
3. Add a renderer branch in `src/renderer/svg.ts` and, if needed, `src/renderer/pixi.ts`.
4. Add a small generator in `src/assets/` and register it in `TEMPLATE_META` / `buildAsset()`.
5. Add a thumbnail and inspector metadata only if the primitive has editable parameters.

Keep the primitive deterministic and JSON-safe. Accept a `seed` whenever the primitive creates variation, and calculate animated values from an explicit `time` rather than accumulating hidden state.

## AI-ready asset generation

The intended future flow is:

```text
prompt
  → constrained asset intent
  → validated JSON AssetDefinition
  → buildAsset / parameter resolver
  → SVG preview + Pixi runtime + exports
```

For example, a model could emit:

```json
{
  "asset": "skill-icon",
  "frame": "jade",
  "rarity": "legendary",
  "element": "spirit",
  "effects": ["ink-glow", "particle-spark", "mist"]
}
```

A future `src/ai/` adapter can map that constrained intent to `AssetControlState`, validate it against an allowlist, and call `buildAsset()`. The model should never emit executable callbacks or renderer internals. The editor can then expose the generated definition as ordinary editable nodes and parameters.

## Known prototype boundaries

- The current timeline is a focused 2.8 second deterministic loop with keyframe visualization; it is not a full node graph or skeletal animation system.
- Pixi rendering approximates gradients/effects with Pixi graphics layers; SVG remains the high-fidelity editor/export renderer.
- Sprite sheet export is implemented as six deterministic frames; PNG sequence export can be added as a zip/manifest pipeline later.
- Undo/redo, persistence, multiplayer collaboration, and a backend are intentionally out of scope for this demo-first prototype.
