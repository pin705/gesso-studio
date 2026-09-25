# SVG craft

Techniques that make vector game art look crafted, with snippets that render correctly in Chromium. Replace the `a-` prefix with your asset id.

## Document skeleton
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"
     data-type="icon" data-style="heroic-fantasy">
  <defs><!-- gradients, clipPaths, masks, filters, all ids prefixed --></defs>
  <!-- back to front: shadow, base, shading, detail, highlights -->
</svg>
```
- width/height are the 1x pixel size; the viewBox matches it. Work on integer coordinates; put 1px and 3px strokes on .5 coordinates so they stay crisp.
- Group by part (`<g id="a-blade">`) so variants and states are easy to edit later.

## Paint
- Prefer `gradientUnits="userSpaceOnUse"` with explicit coordinates: predictable across shapes and variants. `objectBoundingBox` gradients fail on zero-width or zero-height shapes (straight lines).
- Offset radial highlights with `fx`/`fy`; angle linear gradients with coordinates or `gradientTransform="rotate(-30 128 128)"`.
- Metal banding needs 5-7 stops (see `materials`); two-stop gradients read as plastic.

## Shading inside a silhouette (the core technique)
Clip light and shadow shapes to the form, so their outer edges stay perfectly aligned with the silhouette:
```xml
<clipPath id="a-body-clip"><path id="a-body-shape" d="..."/></clipPath>
<use href="#a-body-shape" fill="#1f7a67"/>
<g clip-path="url(#a-body-clip)">
  <path d="...core shadow region..." fill="#16574d"/>
  <path d="...lit plane region..." fill="#3fa287"/>
  <ellipse cx="..." cy="..." rx="..." ry="..." fill="#7fcfb0" opacity=".6" filter="url(#a-soft)"/>
</g>
```
Hard-edged shadow shapes plus a few soft (blurred) ones is what reads as painted rather than plotted.

## Bevel lips
Rounded rectangles: stack offset copies inside the face clip. Light shows as the top lip, dark as the bottom lip, with natural taper at the corners.
```xml
<clipPath id="a-face-clip"><rect x="10" y="10" width="300" height="90" rx="24"/></clipPath>
<g clip-path="url(#a-face-clip)">
  <rect x="10" y="10" width="300" height="90" rx="24" fill="#cdeee0"/>   <!-- top lip -->
  <rect x="10" y="14" width="300" height="90" rx="24" fill="#0e3b36"/>   <!-- bottom lip -->
  <rect x="10" y="14" width="300" height="82" rx="24" fill="#1f7a67"/>   <!-- face -->
</g>
```
Any shape: stroke the shape's path inside its own clip and translate the stroke 2-3px down (light lip) or up (dark lip).

## Outlines
- Outside outline: draw the silhouette behind the form with a stroke twice the wanted width; the form covers the inner half.
- Heavier outline on the shadow side: a dark copy of the silhouette offset 1-3px down-right, behind the form.
- Outline color is the darkest step of the local ramp (or the art bible's outline color), not pure black.
- Tapered, calligraphic lines are filled paths (two curves meeting at sharp tips), not uniform strokes.

## Filters (put them in defs, keep the region large enough)
```xml
<!-- soft blur for shading blobs -->
<filter id="a-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>

<!-- inner shadow: darkens the inside top edge -->
<filter id="a-inset" x="-10%" y="-10%" width="120%" height="120%">
  <feFlood flood-color="#06140f" flood-opacity=".7"/>
  <feComposite in2="SourceAlpha" operator="out"/>
  <feOffset dy="5"/>
  <feGaussianBlur stdDeviation="4"/>
  <feComposite in2="SourceAlpha" operator="in"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge>
</filter>

<!-- grain for a specific material (stone, paper, parchment) -->
<filter id="a-grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .7 0 0 0 -.22"/>
  <feComposite in2="SourceGraphic" operator="in"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge>
</filter>

<!-- hand-inked wobble on outlines or brush shapes -->
<filter id="a-wobble" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/>
  <feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G"/>
</filter>

<!-- glow: only for emissive elements -->
<filter id="a-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="6" result="blur"/>
  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>

<!-- UI drop shadow -->
<filter id="a-drop" x="-20%" y="-20%" width="140%" height="160%">
  <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#10202a" flood-opacity=".45"/>
</filter>
```
- Glows and shadows need room: keep 8-16px of padding in the canvas or they clip.
- Prefer shapes over filters where a shape works; filters are the seasoning.

## Blending and masks
- `style="mix-blend-mode:multiply"` for shadow glazes, `screen` for light and glow, `overlay` for tinting. Wrap the part in `<g style="isolation:isolate">` so the blend stays inside it.
- Masks with gradients fade a layer smoothly (luminance: white shows, black hides).

## Text
UI chrome is textless. For logos and titles use `paint-order="stroke"` with a stroke for outlined lettering, and only local system font stacks (web fonts do not load inside `<img>` or engines).

## Animation (VFX, idle loops)
- SMIL (`<animate>`, `<animateTransform>`, `<animateMotion>`) or CSS `@keyframes` in a `<style>` element.
- Give every animation the same `dur` equal to `data-duration`, with `repeatCount="indefinite"`, and place events inside the loop with `keyTimes`. The loop stays in sync and exported frames line up.
- Ease with `calcMode="spline"` and `keySplines` (one spline per interval): `.2 .8 .2 1` is a strong ease-out for impacts.
- Draw-on effects: `pathLength="1" stroke-dasharray="1 1"` and animate `stroke-dashoffset` from 1 to 0.
- Scale or rotate around a point: put the content centered at 0,0 inside `<g transform="translate(cx cy)">`, then animate the inner group.
```xml
<g transform="translate(256 256)"><g>
  <circle r="40" fill="#fff"/>
  <animateTransform attributeName="transform" type="scale" values="0.2;1.2;1" keyTimes="0;.3;1"
    calcMode="spline" keySplines=".2 .8 .2 1;.4 0 .6 1" dur="0.6s" repeatCount="indefinite"/>
</g></g>
```

## Pitfalls
- Duplicate or generic ids: when SVGs are inlined together, `url(#grad1)` resolves to the first match in the page. Always prefix.
- `<clipPath>` edges are aliased hard: soften a clipped shape's inner edge with a blurred child, not the clip.
- Stroke on a clipped shape shows only its inner half.
- Opacity on a group fades the group as one; opacity on children makes overlaps visible.
- No `<script>`, `<foreignObject>` or external URLs: engines and `<img>` will not load them.
