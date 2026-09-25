import type { Point } from '../types/scene';

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pointString(point: Point): string {
  return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

export function smoothPath(points: Point[], closed = false): string {
  if (points.length < 2) return '';
  const parts = [`M ${pointString(points[0])}`];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    const midY = (previous.y + current.y) / 2;
    parts.push(`Q ${pointString(previous)} ${midX.toFixed(2)},${midY.toFixed(2)}`);
  }
  const last = points[points.length - 1];
  if (closed) {
    const first = points[0];
    parts.push(`Q ${pointString(last)} ${((last.x + first.x) / 2).toFixed(2)},${((last.y + first.y) / 2).toFixed(2)} Z`);
  } else {
    parts.push(`L ${pointString(last)}`);
  }
  return parts.join(' ');
}

export function roughenPoints(points: Point[], amount: number, seed: number): Point[] {
  const random = seededRandom(seed);
  return points.map((point, index) => {
    const edgeScale = index === 0 || index === points.length - 1 ? 0.45 : 1;
    return {
      x: point.x + (random() - 0.5) * amount * edgeScale,
      y: point.y + (random() - 0.5) * amount * edgeScale
    };
  });
}

export function strokeOutline(points: Point[], width: number, roughness: number, seed: number): string {
  if (points.length < 2) return '';
  const random = seededRandom(seed);
  const left: Point[] = [];
  const right: Point[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.max(0.001, Math.hypot(dx, dy));
    const nx = -dy / length;
    const ny = dx / length;
    const pressure = 0.68 + random() * 0.48;
    const localWidth = width * pressure;
    const irregularity = (random() - 0.5) * width * roughness * 0.6;
    const half = localWidth / 2 + irregularity;
    const point = points[index];
    left.push({ x: point.x + nx * half, y: point.y + ny * half });
    right.push({ x: point.x - nx * half, y: point.y - ny * half });
  }
  const tail = right[0];
  const head = right[right.length - 1];
  return `${smoothPath(left)} L ${pointString(head)} ${smoothPath(right.reverse()).replace(/^M[^C]*/, '')} L ${pointString(tail)} Z`;
}

export function createBrushStroke(
  points: Point[],
  width: number,
  seed = 1,
  roughness = 0.42
): string {
  return strokeOutline(roughenPoints(points, width * roughness * 0.22, seed + 19), width, roughness, seed);
}

export function createInkStroke(
  points: Point[],
  width: number,
  seed = 7,
  roughness = 0.75
): string {
  const outline = createBrushStroke(points, width, seed, roughness);
  const dry = createBrushStroke(
    points.map((point) => ({ x: point.x + 1.2, y: point.y - 0.8 })),
    width * 0.22,
    seed + 31,
    roughness * 1.4
  );
  return `${outline} ${dry}`;
}

export function createSlash(
  start: Point,
  controlA: Point,
  controlB: Point,
  end: Point,
  seed = 1
): string {
  const random = seededRandom(seed);
  const jitter = () => (random() - 0.5) * 2.2;
  return `M ${start.x + jitter()} ${start.y + jitter()} C ${controlA.x + jitter()} ${controlA.y + jitter()}, ${controlB.x + jitter()} ${controlB.y + jitter()}, ${end.x + jitter()} ${end.y + jitter()}`;
}

export function createEnergyArc(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  seed = 1,
  segments = 22
): string {
  const random = seededRandom(seed);
  const points: Point[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    const angle = startAngle + (endAngle - startAngle) * progress;
    const wobble = 1 + (random() - 0.5) * 0.035;
    points.push({
      x: center.x + Math.cos(angle) * radius * wobble,
      y: center.y + Math.sin(angle) * radius * wobble
    });
  }
  return smoothPath(points);
}

export function starPoints(
  center: Point,
  outerRadius: number,
  innerRadius: number,
  points = 5,
  rotation = -Math.PI / 2
): Point[] {
  return Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (index * Math.PI) / points;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
}

export function polygonPoints(center: Point, radius: number, sides: number, rotation = -Math.PI / 2): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (index * Math.PI * 2) / sides;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
}

export function wavyLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amplitude: number,
  segments: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const points: Point[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    points.push({
      x: x1 + (x2 - x1) * progress,
      y: y1 + (y2 - y1) * progress + (random() - 0.5) * amplitude
    });
  }
  return smoothPath(points);
}
