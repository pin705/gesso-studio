import type { AssetDefinition, Paint, RenderOptions, SceneNode } from '../types/scene';

interface RenderContext {
  defs: string[];
  filters: Map<string, string>;
  gradients: Map<string, string>;
  counter: number;
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function numeric(value: number | undefined, fallback = 0): number {
  return Number.isFinite(value) ? (value as number) : fallback;
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function paintId(paint: Paint, context: RenderContext, nodeId: string): string {
  if (typeof paint === 'string') return paint;
  const key = `${nodeId}-${paint.kind}-${JSON.stringify(paint)}`;
  const existing = context.gradients.get(key);
  if (existing) return existing;
  const id = `paint-${context.counter++}`;
  context.gradients.set(key, `url(#${id})`);
  const stops = paint.stops
    .map((stop) => `<stop offset="${stop.offset * 100}%" stop-color="${xml(stop.color)}"${stop.opacity === undefined ? '' : ` stop-opacity="${stop.opacity}"`} />`)
    .join('');
  if (paint.kind === 'linear') {
    context.defs.push(
      `<linearGradient id="${id}" x1="${paint.x1 ?? 0}" y1="${paint.y1 ?? 0}" x2="${paint.x2 ?? 1}" y2="${paint.y2 ?? 1}" gradientUnits="${paint.units ?? 'objectBoundingBox'}">${stops}</linearGradient>`
    );
  } else {
    context.defs.push(
      `<radialGradient id="${id}" cx="${paint.cx ?? 0.5}" cy="${paint.cy ?? 0.5}" r="${paint.r ?? 0.5}" fx="${paint.fx ?? paint.cx ?? 0.5}" fy="${paint.fy ?? paint.cy ?? 0.5}" gradientUnits="${paint.units ?? 'objectBoundingBox'}">${stops}</radialGradient>`
    );
  }
  return `url(#${id})`;
}

function effectFilter(effects: readonly string[], context: RenderContext, nodeId: string): string {
  if (!effects.length) return '';
  const key = effects.join('|');
  const existing = context.filters.get(key);
  if (existing) return existing;
  const id = `filter-${safeId(nodeId)}-${context.counter++}`;
  const parts: string[] = [];
  if (effects.includes('rough') || effects.includes('ink') || effects.includes('noise')) {
    parts.push('<feTurbulence type="fractalNoise" baseFrequency="0.018 0.12" numOctaves="2" seed="19" result="noise" />');
    parts.push('<feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="rough" />');
    parts.push('<feGaussianBlur in="rough" stdDeviation="0.22" result="inkSoft" />');
    parts.push('<feColorMatrix in="inkSoft" type="saturate" values="0.82" result="inkMuted" />');
    parts.push('<feBlend in="SourceGraphic" in2="inkMuted" mode="multiply" />');
  }
  if (effects.includes('glow') || effects.includes('soft-glow')) {
    const std = effects.includes('soft-glow') ? '5' : '2.2';
    parts.push(`<feGaussianBlur stdDeviation="${std}" result="blur" />`);
    parts.push('<feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.1 0 1 0 0 0.1 0 0 1 0 0.1 0 0 0 1 0" result="coloredBlur" />');
    parts.push('<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>');
  }
  if (effects.includes('shadow') || effects.includes('soft-shadow')) {
    const dx = effects.includes('soft-shadow') ? 0 : 3;
    const dy = effects.includes('soft-shadow') ? 7 : 5;
    const blur = effects.includes('soft-shadow') ? 7 : 3;
    parts.push(`<feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur}" flood-color="#000814" flood-opacity="0.72" result="shadow" />`);
    parts.push('<feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>');
  }
  if (effects.includes('blur') || effects.includes('mist')) {
    parts.push('<feGaussianBlur stdDeviation="2.4" />');
  }
  if (effects.includes('paper')) {
    parts.push('<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="7" result="paperNoise" />');
    parts.push('<feColorMatrix in="paperNoise" type="saturate" values="0" result="paperGray" />');
    parts.push('<feComponentTransfer in="paperGray" result="paperAlpha"><feFuncA type="table" tableValues="0 0.12" /></feComponentTransfer>');
    parts.push('<feBlend in="SourceGraphic" in2="paperAlpha" mode="multiply" />');
  }
  if (!parts.length) return '';
  context.filters.set(key, `url(#${id})`);
  context.defs.push(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="sRGB">${parts.join('')}</filter>`);
  return `url(#${id})`;
}

function commonAttributes(node: SceneNode, context: RenderContext): string {
  const attributes: string[] = [`data-node-id="${xml(node.id)}"`, `data-node-type="${node.type}"`];
  if (node.name) attributes.push(`data-node-name="${xml(node.name)}"`);
  if (node.opacity !== undefined) attributes.push(`opacity="${numeric(node.opacity, 1)}"`);
  if (node.blendMode) attributes.push(`style="mix-blend-mode:${node.blendMode}"`);
  if (node.mask) attributes.push(`mask="url(#${xml(node.mask)})"`);
  if (node.clipPath) attributes.push(`clip-path="url(#${xml(node.clipPath)})"`);
  if (node.effects?.length) {
    const filter = effectFilter(node.effects, context, node.id);
    if (filter) attributes.push(`filter="${filter}"`);
  }
  return attributes.join(' ');
}

function paintAttributes(node: SceneNode, context: RenderContext): string {
  const attributes: string[] = [];
  if (node.fill === undefined) attributes.push('fill="none"');
  else attributes.push(`fill="${paintId(node.fill, context, `${node.id}-fill`)}"`);
  if (node.stroke !== undefined) {
    attributes.push(`stroke="${paintId(node.stroke, context, `${node.id}-stroke`)}"`);
    attributes.push(`stroke-width="${numeric(node.strokeWidth, 1)}"`);
    attributes.push(`stroke-opacity="${numeric(node.strokeOpacity, 1)}"`);
    if (node.lineCap) attributes.push(`stroke-linecap="${node.lineCap}"`);
    if (node.lineJoin) attributes.push(`stroke-linejoin="${node.lineJoin}"`);
    if (node.dash) attributes.push(`stroke-dasharray="${xml(node.dash)}"`);
    if (node.dashOffset !== undefined) attributes.push(`stroke-dashoffset="${node.dashOffset}"`);
  }
  return attributes.join(' ');
}

function transformAttribute(node: SceneNode): string {
  const parts: string[] = [];
  if (node.x !== undefined || node.y !== undefined) parts.push(`translate(${numeric(node.x)} ${numeric(node.y)})`);
  if (node.rotation) parts.push(`rotate(${node.rotation})`);
  if (node.scaleX !== undefined || node.scaleY !== undefined) parts.push(`scale(${numeric(node.scaleX, 1)} ${numeric(node.scaleY, 1)})`);
  return parts.length ? ` transform="${parts.join(' ')}"` : '';
}

function pointsAttribute(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

function textAttributes(node: SceneNode): string {
  const attributes = [
    `x="${numeric(node.x)}"`,
    `y="${numeric(node.y)}"`,
    `font-size="${numeric(node.fontSize, 16)}"`,
    `font-family="${xml(node.fontFamily ?? 'Noto Serif SC, Songti SC, serif')}"`,
    `font-weight="${node.fontWeight ?? 500}"`,
    `font-style="${node.fontStyle ?? 'normal'}"`,
    `letter-spacing="${numeric(node.letterSpacing, 0)}"`,
    `text-anchor="${node.textAnchor ?? 'start'}"`,
    `dominant-baseline="${node.baseline ?? 'alphabetic'}"`
  ];
  if (node.dash) attributes.push(`data-text-dash="${xml(node.dash)}"`);
  return attributes.join(' ');
}

function renderParticle(node: SceneNode, context: RenderContext): string {
  const particle = node.particle;
  if (!particle) return '';
  const attributes = commonAttributes(node, context);
  const fill = paintId(particle.color, context, `${node.id}-particle`);
  const rotation = particle.rotation ?? 0;
  if (particle.kind === 'leaf' || particle.kind === 'snow') {
    return `<g ${attributes} transform="translate(${particle.x} ${particle.y}) rotate(${rotation})"><path d="M 0 -4 C 3 -1 3 2 0 4 C -3 2 -3 -1 0 -4 Z" fill="${fill}" stroke="${fill}" stroke-width="0.5" /></g>`;
  }
  return `<g ${attributes} transform="translate(${particle.x} ${particle.y}) rotate(${rotation})"><circle r="${particle.size}" fill="${fill}" /><circle r="${Math.max(0.5, particle.size * 0.42)}" fill="#fff" opacity="${Math.min(0.75, particle.opacity * 0.7)}" /></g>`;
}

function renderNode(node: SceneNode, context: RenderContext): string {
  const attributes = commonAttributes(node, context);
  const paint = paintAttributes(node, context);
  switch (node.type) {
    case 'group': {
      const children = (node.children ?? []).map((child) => renderNode(child, context)).join('');
      return `<g ${attributes}${transformAttribute(node)}>${children}</g>`;
    }
    case 'rect':
      return `<rect ${attributes} ${paint} x="${numeric(node.x)}" y="${numeric(node.y)}" width="${numeric(node.width, 1)}" height="${numeric(node.height, 1)}" />`;
    case 'rounded-rect':
      return `<rect ${attributes} ${paint} x="${numeric(node.x)}" y="${numeric(node.y)}" width="${numeric(node.width, 1)}" height="${numeric(node.height, 1)}" rx="${numeric(node.radius, 8)}" />`;
    case 'circle':
      return `<circle ${attributes} ${paint} cx="${numeric(node.x)}" cy="${numeric(node.y)}" r="${numeric(node.radius ?? node.width ?? 1, 1)}" />`;
    case 'ellipse':
      return `<ellipse ${attributes} ${paint} cx="${numeric(node.x)}" cy="${numeric(node.y)}" rx="${numeric(node.width, 1) / 2}" ry="${numeric(node.height, 1) / 2}" transform="${node.rotation ? `rotate(${node.rotation} ${numeric(node.x)} ${numeric(node.y)})` : ''}" />`;
    case 'line':
      return `<line ${attributes} ${paint} x1="${numeric(node.x)}" y1="${numeric(node.y)}" x2="${numeric(node.x2 ?? numeric(node.x) + numeric(node.width, 1))}" y2="${numeric(node.y2 ?? numeric(node.y) + numeric(node.height, 1))}" />`;
    case 'polygon':
      return `<polygon ${attributes} ${paint} points="${pointsAttribute(node.points ?? [])}" />`;
    case 'star':
      return `<polygon ${attributes} ${paint} points="${pointsAttribute(node.points ?? [])}" />`;
    case 'arc':
      return `<path ${attributes} ${paint} d="${xml(node.d ?? `M ${numeric(node.x)} ${numeric(node.y)} A ${numeric(node.radius, 1)} ${numeric(node.radius, 1)} 0 0 1 ${numeric(node.x) + numeric(node.radius, 1)} ${numeric(node.y)}`)}" />`;
    case 'path':
      return `<path ${attributes} ${paint} d="${xml(node.d ?? '')}"${node.pathLength !== undefined ? ` pathLength="${node.pathLength}"` : ''}${node.pathProgress !== undefined ? ` stroke-dasharray="${node.pathProgress} ${Math.max(0.001, (node.pathLength ?? 1) - node.pathProgress)}" stroke-dashoffset="${node.dashOffset ?? 0}"` : ''}${transformAttribute(node)} />`;
    case 'text':
      return `<text ${attributes} ${paint} ${textAttributes(node)}>${xml(node.text ?? '')}</text>`;
    case 'particle':
      return renderParticle(node, context);
    default:
      return '';
  }
}

function nodeBounds(node: SceneNode): { x: number; y: number; width: number; height: number } | null {
  if (node.type === 'group') {
    const children = (node.children ?? []).map(nodeBounds).filter(Boolean) as Array<{ x: number; y: number; width: number; height: number }>;
    if (!children.length) return null;
    const left = Math.min(...children.map((child) => child.x));
    const top = Math.min(...children.map((child) => child.y));
    const right = Math.max(...children.map((child) => child.x + child.width));
    const bottom = Math.max(...children.map((child) => child.y + child.height));
    return { x: left + numeric(node.x), y: top + numeric(node.y), width: right - left, height: bottom - top };
  }
  if (node.type === 'text') {
    const size = numeric(node.fontSize, 16);
    const width = Math.max(10, (node.text?.length ?? 1) * size * 0.72);
    return { x: numeric(node.x), y: numeric(node.y) - size, width, height: size * 1.3 };
  }
  if (node.type === 'circle' || node.type === 'ellipse') {
    const width = node.type === 'circle' ? numeric(node.radius ?? node.width, 1) * 2 : numeric(node.width, 1);
    const height = node.type === 'circle' ? numeric(node.radius ?? node.height, 1) * 2 : numeric(node.height, 1);
    return { x: numeric(node.x) - width / 2, y: numeric(node.y) - height / 2, width, height };
  }
  if (node.type === 'particle') {
    const size = node.particle?.size ?? 1;
    return { x: numeric(node.particle?.x ?? node.x) - size, y: numeric(node.particle?.y ?? node.y) - size, width: size * 2, height: size * 2 };
  }
  if (node.type === 'line') {
    return { x: numeric(node.x), y: numeric(node.y), width: Math.abs(numeric(node.x2 ?? numeric(node.x) + numeric(node.width, 1)) - numeric(node.x)), height: Math.abs(numeric(node.y2 ?? numeric(node.y) + numeric(node.height, 1)) - numeric(node.y)) };
  }
  if (node.type === 'path' || node.type === 'arc') return { x: numeric(node.x), y: numeric(node.y), width: numeric(node.width, 0), height: numeric(node.height, 0) };
  return { x: numeric(node.x), y: numeric(node.y), width: numeric(node.width, 1), height: numeric(node.height, 1) };
}

function findNode(nodes: SceneNode[], id: string): SceneNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function selectionMarkup(asset: AssetDefinition, selectedId: string): string {
  const node = findNode(asset.nodes, selectedId);
  if (!node) return '';
  const bounds = nodeBounds(node);
  if (!bounds) return '';
  const { x, y, width, height } = bounds;
  const handles = [
    [x, y],
    [x + width / 2, y],
    [x + width, y],
    [x, y + height / 2],
    [x + width, y + height / 2],
    [x, y + height],
    [x + width / 2, y + height],
    [x + width, y + height]
  ];
  return `<g class="selection-overlay" pointer-events="none"><rect x="${x - 3}" y="${y - 3}" width="${width + 6}" height="${height + 6}" rx="3" fill="none" stroke="#71e5d0" stroke-width="1" stroke-dasharray="4 3" opacity="0.9" />${handles.map(([hx, hy]) => `<rect x="${hx - 3}" y="${hy - 3}" width="6" height="6" rx="1" fill="#0b1115" stroke="#71e5d0" stroke-width="1" />`).join('')}<rect x="${x - 3}" y="${y - 25}" width="${Math.max(78, node.name?.length ?? 8) * 6.4}" height="17" rx="3" fill="#71e5d0" /><text x="${x + 5}" y="${y - 13}" fill="#071114" font-family="monospace" font-size="9" font-weight="700" letter-spacing="0.6">${xml(node.name ?? node.id)}</text></g>`;
}

function checkerPattern(context: RenderContext): void {
  context.defs.push('<pattern id="studio-checker" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#11171c" /><path d="M0 0h12v12H0z M12 12h12v12H12z" fill="#161e24" /></pattern>');
}

function baseDefs(context: RenderContext): void {
  context.defs.push(
    '<filter id="selection-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5" /></filter>'
  );
}

export function renderSceneSVG(asset: AssetDefinition, options: RenderOptions = {}): string {
  const context: RenderContext = { defs: [], filters: new Map(), gradients: new Map(), counter: 0 };
  checkerPattern(context);
  baseDefs(context);
  const renderableNodes = options.transparent ? asset.nodes.filter((node) => !node.id.startsWith('background-')) : asset.nodes;
  const content = renderableNodes.map((node) => renderNode(node, context)).join('');
  const selection = options.showSelection && options.selectedId ? selectionMarkup(asset, options.selectedId) : '';
  const background = options.transparent ? '' : `<rect width="${asset.width}" height="${asset.height}" fill="url(#studio-checker)" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}" viewBox="0 0 ${asset.width} ${asset.height}" role="img" aria-label="${xml(options.title ?? asset.name)}"><defs>${context.defs.join('')}</defs>${background}${content}${selection}</svg>`;
}

export function sceneToDataUrl(asset: AssetDefinition, options: RenderOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSceneSVG(asset, options))}`;
}

export function findSceneNode(asset: AssetDefinition, id: string): SceneNode | null {
  return findNode(asset.nodes, id);
}
