// Gesso Kit: three.js presets for rendered game items. Use with threeStage() from /kit/gesso.mjs.
//
//   const stage = await threeStage();
//   const ruby = gem(stage.THREE, { color: 0xb00020 });
//   stage.scene.add(ruby);
//
// Every preset returns a THREE.Group centred on the origin, about 2 units tall, lit for the studio environment.

/** Stitch two rings of vertices (sorted by angle) into triangles, whatever their vertex counts. */
function stitch(positions, a, b) {
  const angle = (point) => point.angle;
  const ringA = [...a, { ...a[0], angle: a[0].angle + Math.PI * 2 }];
  const ringB = [...b, { ...b[0], angle: b[0].angle + Math.PI * 2 }];
  let i = 0;
  let j = 0;
  while (i < ringA.length - 1 || j < ringB.length - 1) {
    const advanceA = j >= ringB.length - 1 || (i < ringA.length - 1 && angle(ringA[i + 1]) <= angle(ringB[j + 1]));
    const triangle = advanceA ? [ringA[i], ringB[j], ringA[i + 1]] : [ringA[i], ringB[j], ringB[j + 1]];
    for (const point of triangle) positions.push(point.x, point.y, point.z);
    if (advanceA) i += 1;
    else j += 1;
  }
}

function ring(count, radius, y, offset = 0, squash = 1) {
  return Array.from({ length: count }, (_, index) => {
    const angle = offset + (index / count) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius * squash, angle };
  });
}

/** Faceted gemstone. cut: 'round' (brilliant) or 'oval'. Deep base colour; the environment makes the facets sparkle. */
export function gem(THREE, { color = 0xb00020, cut = 'round', glow = 0x4a0010 } = {}) {
  const squash = cut === 'oval' ? 0.72 : 1;
  const top = 0.42;
  const rings = [
    ring(1, 0, top, 0, squash),                        // table centre
    ring(8, 0.56, top, 0, squash),                     // table edge
    ring(8, 0.82, top * 0.52, Math.PI / 8, squash),    // star / kite points
    ring(16, 1, 0.03, 0, squash),                      // girdle top
    ring(16, 1, -0.03, 0, squash),                     // girdle bottom
    ring(8, 0.52, -0.55, Math.PI / 8, squash),         // pavilion
    ring(1, 0, -1.05, 0, squash)                       // culet
  ];
  const positions = [];
  for (let index = 0; index < rings.length - 1; index += 1) stitch(positions, rings[index], rings[index + 1]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({
    color, emissive: glow, metalness: 0.1, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02,
    ior: 2.0, specularIntensity: 1, specularColor: 0xffffff, envMapIntensity: 2.6, flatShading: true, side: THREE.DoubleSide
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, material));
  group.rotation.set(0.42, 0.25, -0.1);
  return group;
}

/** A kit silhouette (or any image URL) as a white shape on black with a soft bevel edge, for bump or emissive maps. */
async function silhouetteCanvas(url, size = 512, padding = 0.18) {
  const image = new Image();
  image.crossOrigin = 'anonymous'; // the kit allows any origin, so sandboxed previews can upload it to WebGL
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const inset = size * padding;
  context.filter = `blur(${size / 200}px)`;
  context.drawImage(image, inset, inset, size - inset * 2, size - inset * 2);
  context.filter = 'none';
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, size, size);
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#000';
  context.fillRect(0, 0, size, size);
  return canvas;
}

/** Stamped coin with a raised rim and an embossed emblem from a silhouette URL (e.g. /kit/icons/game-icons/crown.svg). */
export async function coin(THREE, { color = 0xf0bc58, emblem, roughness = 0.36 } = {}) {
  const group = new THREE.Group();
  // profile of the edge: face, raised rim, milled side
  const profile = [[0, 0.16], [0.78, 0.16], [0.84, 0.22], [0.97, 0.22], [1, 0.17], [1, -0.17], [0.97, -0.22], [0.84, -0.22], [0.78, -0.16], [0, -0.16]].map(([x, y]) => new THREE.Vector2(x, y));
  const metal = new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 2.6 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), metal);
  body.rotation.x = Math.PI / 2;
  group.add(body);
  if (emblem) {
    const texture = new THREE.CanvasTexture(await silhouetteCanvas(emblem));
    const faceMaterial = metal.clone();
    faceMaterial.bumpMap = texture;
    faceMaterial.bumpScale = 14;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 96), faceMaterial);
    face.position.z = 0.161;
    group.add(face);
  }
  group.rotation.set(0.22, -0.42, 0.1);
  return group;
}

/** Round potion flask: glass body, glowing liquid with a meniscus, cork. */
export function potion(THREE, { liquid = 0x8e0c18, glow = 0xff3a1a, level = 0.62, glass = 0xdfeeff, cork = 0x7a5233 } = {}) {
  const group = new THREE.Group();
  const flask = [[0, -1], [0.35, -0.98], [0.62, -0.86], [0.8, -0.62], [0.86, -0.3], [0.8, 0.02], [0.6, 0.26], [0.3, 0.42], [0.22, 0.52], [0.22, 0.86], [0.28, 0.9], [0.28, 0.98], [0.2, 1]].map(([x, y]) => new THREE.Vector2(x, y));
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: glass, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.16, clearcoat: 1, envMapIntensity: 3, side: THREE.DoubleSide, depthWrite: false });
  const body = new THREE.Mesh(new THREE.LatheGeometry(flask, 64), glassMaterial);
  // liquid: the flask shrunk inward, cut at the fill level
  const top = -1 + level * 1.3;
  const inner = flask.filter((point) => point.y < top).map((point) => new THREE.Vector2(Math.max(0, point.x - 0.05), point.y));
  const radiusAtTop = new THREE.Vector2(0.86 - 0.05, top);
  inner.push(radiusAtTop, new THREE.Vector2(0, top));
  const liquidMaterial = new THREE.MeshPhysicalMaterial({ color: liquid, emissive: glow, emissiveIntensity: 0.32, metalness: 0, roughness: 0.15, clearcoat: 1, envMapIntensity: 1.2 });
  const fill = new THREE.Mesh(new THREE.LatheGeometry(inner, 64), liquidMaterial);
  const surface = new THREE.Mesh(new THREE.CircleGeometry(radiusAtTop.x * 0.99, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(liquid).lerp(new THREE.Color(glow), 0.6) }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = top;
  const corkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.34, 32), new THREE.MeshStandardMaterial({ color: cork, roughness: 0.85 }));
  corkMesh.position.y = 1.08;
  const light = new THREE.PointLight(glow, 6, 3);
  light.position.set(0.1, -0.5, 0.3);
  group.add(fill, surface, body, corkMesh, light);
  group.rotation.set(0.12, 0, -0.14);
  return group;
}
