# Game Art Studio architecture

## Design rule

The authored document is plain JSON. Rendering objects never enter the document.

```text
AssetControlState (editor intent)
          │
          ▼
  buildAsset(templateId, controls, time)
          │
          ▼
 AssetDefinition { width, height, seed, nodes[], parameters }
       │             │              │
       ▼             ▼              ▼
   SVG editor    Pixi runtime     JSON/export
```

`src/assets/` contains generators. A generator is a pure function of controls and time. It does not read the DOM, create a canvas, or keep animation state. This makes the same definition usable in the editor, a game runtime, an exporter, and a future AI tool.

## Scene graph

`SceneNode` is a discriminated record with a stable `id`, a geometry `type`, optional transform values, `Paint` values, effects, and child nodes. Groups provide local composition. Paint is either a color string, a linear gradient, or a radial gradient.

The important node types are:

- geometry: `rect`, `rounded-rect`, `circle`, `ellipse`, `line`, `polygon`, `star`, `path`, `arc`
- composition: `group`
- content: `text`
- simulation: `particle`

`seed`, `roughness`, `distortion`, `noise`, and `textureScale` are data, not hidden closures. An unchanged seed produces unchanged paths and particle positions.

## Rendering adapters

### SVG

`src/renderer/svg.ts` walks the scene graph and serializes it to an SVG string. It creates local gradient/filter definitions, maps effects to SVG filter primitives, and adds selection guides only when `showSelection` is true. `transparent: true` omits the generated background layer for alpha exports and alpha previews.

### PixiJS

`src/renderer/pixi.ts` walks the same scene graph into Pixi `Container`, `Graphics`, and `Text` instances. `ProceduralPixiAsset` exposes:

```ts
asset.play();
asset.pause();
asset.setTime(0.72);
asset.getProgress();
```

Pixi uses flat approximations for gradients where necessary, but consumes the same IDs, transforms, paints, text, and particle data. A future renderer can add masks, shaders, or texture caching without changing the asset schema.

## Procedural systems

- `src/primitives/path.ts` owns seeded randomness, smooth paths, tapered brush outlines, energy arcs, and slash curves.
- `src/primitives/shapes.ts` exposes shape factories.
- `src/primitives/materials.ts` defines parameterized material tokens.
- `src/primitives/ink.ts` creates rough borders, ink strokes, splashes, clouds, and ornaments.
- `src/primitives/particles.ts` evaluates stateless particle presets from time.
- `src/effects/index.ts` is the stable high-level effect API.
- `src/timeline/index.ts` contains keyframe interpolation and easing functions.

## Editor/runtime separation

`App.svelte` owns lightweight editor state: active template, selected node, current time, zoom, panel toggles, and controls. It does not store Pixi objects. `PixiRuntimeModal` creates and destroys an imperative Pixi application in `onMount`; the asset passed into it remains a serializable snapshot.

The timeline is time-addressable. A VFX generator can be evaluated at `t=0`, `t=0.72`, or `t=2.4` without replaying an emitter. This is what makes scrubbing deterministic and keeps sprite-sheet frames aligned with the editor.

## Export boundary

`src/export/exporter.ts` contains browser-only adapters. SVG is serialized directly. PNG/WebP rasterization uses a dedicated canvas rather than the visible editor canvas, so zoom, pan, and selection overlays are excluded. JSON includes a schema version and generator version. Sprite sheets call the same `buildAsset()` function for each frame.

## AI boundary

`src/ai/intent.ts` is intentionally smaller than the scene schema. A future model can emit an `AssetIntent`, which is normalized and allowlisted before it becomes `AssetControlState`. The model cannot inject functions, DOM nodes, Pixi objects, or arbitrary shader source.

```text
prompt → AssetIntent → normalizeAssetIntent() → intentToControls()
       → buildAsset() → editable AssetDefinition
```

## Extension recipe

To add a primitive:

1. Add its serializable shape data to `SceneNode`.
2. Add a pure factory in `src/primitives/shapes.ts` or a domain-specific generator.
3. Add an SVG branch in `src/renderer/svg.ts`.
4. Add a Pixi branch in `src/renderer/pixi.ts` if it should appear at runtime.
5. Register a template or component factory.
6. Add a deterministic check and an export/render check.

The shortest safe extension is a pure geometry node plus one renderer branch. Add a new effect only when its output can be described by the existing material/effect vocabulary.
