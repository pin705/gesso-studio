# Material recipes

A material is identified by three things: its value range (contrast), its edge sharpness, and the shape of its highlights. Get those right and the color can vary with the art bible. Light is top-left in every recipe; mirror it if the art bible says otherwise. Hex values are examples; take real ones from the project ramps.

Texture scale matters more than texture choice: tile `grain / hammered / brushed / stone / veins` at 260-320px for UI chrome (100-400px assets). At 1024px the relief vanishes and reads as flat plastic — the most common reason good ramps still score 3. The kit defaults to this range; keep it.

## Polished gold
- Full value range: near-black warm brown to near-white yellow. Shadows are warm (brown, red-orange), never gray.
- Reflections band: multi-stop linear gradient across the form, alternating light and dark (e.g. offsets 0 light, .3 dark, .45 bright, .7 mid, 1 darkest). Bands follow the form: angle them along cylinders, curve them on spheres (radial with an off-center focus).
- Hard, bright specular strokes on edges facing the light; a thin dark line where two planes meet.
- Engraving: dark line with a light line 1px below it (incised) or above it (embossed).
- Example ramp: #3d2106 #6e3f10 #a8691f #d9a441 #f5d27a #fff6d6.

## Silver, steel, chrome
- Cool gray-blue ramp, high contrast. "Horizon" reflection: lighter top half (sky), a sharp dark band just below the middle (horizon), then a lighter bottom (ground bounce).
- Brushed steel: fine parallel lines at 5-10% opacity along the brushing direction.
- Edges catch thin bright highlights; the core shadow is dark and narrow.

## Iron and dark metal
- Low saturation, mid-dark values, softer highlights than steel.
- Wear: lighter, sharper scratches and chips on exposed edges; darker warm grime in crevices; optional rust (desaturated orange-brown) in spots, never evenly.
- Rivets: small circle with a highlight dot top-left and a shadow crescent bottom-right.

## Faceted gems
- Build from flat facet polygons, each a different value: the table (top facet) lighter, the pavilion (lower facets) darker, saturated mid facets between.
- Light enters and exits: the side opposite the light gets a bright internal glow (refraction). This single detail sells "gem" over "plastic".
- One tiny sharp specular (small four-point star or dot) on the lit edge, a dark outline one ramp step darker than the darkest facet.

## Jade and other translucent stone
- Soft, low-contrast values; no pure darks inside. Subsurface: a soft lighter glow toward the side opposite the light and near thin edges.
- Milky, broad, soft highlight on the lit side instead of a sharp specular; a thin bright rim on the top edge.
- Subtle cloudy veins: low-contrast noise masked to the shape (turbulence at low frequency, 8-15% opacity).
- Example ramp: #0e3b36 #16574d #1f7a67 #3fa287 #7fcfb0 #cdeee0.

## Glass and potion bottles
- Mostly transparent: fill the glass at 5-15% opacity; what defines it is its edges.
- Bright thin rim on the lit side, darker rim on the shadow side, one crisp window-shaped highlight (rounded rectangle or curved streak) on the upper lit area, a small secondary highlight on the opposite lower edge.
- Liquid: more saturated and darker at the bottom, lighter near the surface; a bright meniscus line at the surface; lit from behind (a glow on the side opposite the light) and a bright caustic spot on the bottom.

## Wood
- Warm browns, mid values. Grain lines follow the form (curved paths), low contrast, darker toward edges and ends; a few knots.
- Planks: dark gaps between boards, light top edges (bevel), slightly varied hue per plank.

## Stone
- Neutral to cool gray, low saturation, low to mid contrast. Irregular chipped silhouette and edges; flat planes with sharp shadows under chips.
- Texture: fine noise at 6-12%, a few cracks (dark line with a light lip), sparse moss or lichen only if the art bible allows.

## Leather and cloth
- Soft shading, broad low highlights, no sharp speculars (except wet or polished leather).
- Stitching along edges (short dashes, light on dark), folds as soft shadow shapes with a light ridge.

## Paper and parchment
- Warm off-white ramp; edges slightly darker and warmer (aged or burnt), fine fiber noise, soft curl shading at corners.

## Energy, magic, fire, holograms (emissive)
- Core to edge: near-white core, then the saturated hue, then a darker shade of the hue, then transparent. Uniform opacity kills energy.
- Use `mix-blend-mode: screen` (or plus-lighter) for glow layers; they brighten what is behind instead of covering it.
- Emissive things light their surroundings: add a rim or cast light in the energy's hue on nearby surfaces.
- Fire: yellow-white core, orange body, red tips, then dark smoke; flames are tapered teardrops licking upward.

## Ice
- Pale cyan to deep blue-violet ramp, sharp angular facets, internal white cracks, frosted soft edges, cool shadows. Sharp specular on corners.
