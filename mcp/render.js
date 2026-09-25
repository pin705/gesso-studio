// Headless Chromium renderer: the AI's eyes. It is the same engine the studio uses,
// so what the agent reviews is exactly what the user sees.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';

export const ASSET_TYPES = ['button', 'panel', 'frame', 'bar', 'icon', 'vfx', 'background', 'other'];

let launching;

function browser() {
  launching ??= launchAny().catch((error) => {
    launching = undefined;
    throw error;
  });
  return launching;
}

async function launchAny() {
  const attempts = [{ channel: 'chrome' }, { channel: 'msedge' }, {}];
  if (process.env.CHROME_PATH) attempts.unshift({ executablePath: process.env.CHROME_PATH });
  for (const options of attempts) {
    try {
      return await chromium.launch(options);
    } catch {
      // try the next browser
    }
  }
  throw new Error('No Chromium-based browser found. Install Google Chrome or Edge, set CHROME_PATH, or run `npx playwright install chromium`.');
}

export async function closeBrowser() {
  const pending = launching;
  launching = undefined;
  if (pending) await (await pending.catch(() => null))?.close();
}

async function withPage(work, viewport = { width: 1600, height: 1600 }) {
  const page = await (await browser()).newPage({ viewport });
  try {
    return await work(page);
  } finally {
    await page.close();
  }
}

/** Runs inside the asset document. Keep it self-contained: Playwright serializes it. */
function lintInPage({ id, types }) {
  const svg = document.documentElement;
  const parseError = document.querySelector('parsererror');
  if (parseError || svg.localName !== 'svg') {
    return { fatal: (parseError?.textContent || `Root element is <${svg.localName}>, expected <svg>.`).trim().slice(0, 600) };
  }
  const errors = [];
  const warnings = [];
  const box = svg.viewBox.baseVal;
  const hasViewBox = svg.hasAttribute('viewBox') && box.width > 0 && box.height > 0;
  const width = svg.hasAttribute('width') ? svg.width.baseVal.value : hasViewBox ? box.width : 0;
  const height = svg.hasAttribute('height') ? svg.height.baseVal.value : hasViewBox ? box.height : 0;
  if (!(width > 0 && height > 0)) return { fatal: 'Cannot determine the canvas size: set width, height and viewBox on <svg>.' };
  if (!hasViewBox) errors.push('Add viewBox="0 0 W H" to <svg> so the asset scales cleanly.');
  if (!svg.hasAttribute('width') || !svg.hasAttribute('height')) errors.push('Set width/height on <svg> to the 1x pixel size.');
  if (width > 4096 || height > 4096) errors.push(`Canvas ${width}x${height} is too large: author at 1x (max 4096px) and export @2x.`);

  const type = svg.getAttribute('data-type') ?? '';
  if (!types.includes(type)) warnings.push(`Set data-type on <svg> to one of: ${types.join(', ')}.`);

  const counts = new Map();
  for (const element of document.querySelectorAll('[id]')) counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([name]) => name);
  if (duplicates.length) errors.push(`Duplicate ids (paint servers resolve to the wrong element): ${duplicates.join(', ')}.`);
  const unprefixed = [...counts.keys()].filter((name) => !name.startsWith(`${id}-`));
  if (unprefixed.length) warnings.push(`${unprefixed.length} id(s) lack the "${id}-" prefix (e.g. ${unprefixed.slice(0, 3).join(', ')}); prefix them so the SVG stays correct when inlined next to others.`);

  const all = [...document.querySelectorAll('*')];
  if (document.querySelector('script, foreignObject')) errors.push('Remove <script>/<foreignObject>: assets must be static, portable SVG.');
  if (all.some((element) => [...element.attributes].some((attribute) => /^on/i.test(attribute.name)))) errors.push('Remove on* event attributes.');
  const external = new Set();
  for (const element of document.querySelectorAll('[*|href]')) {
    const href = element.getAttribute('href') ?? element.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? '';
    if (/^(https?:)?\/\//i.test(href)) external.add(href);
  }
  for (const style of document.querySelectorAll('style')) {
    for (const match of style.textContent.matchAll(/url\(\s*['"]?((?:https?:)?\/\/[^'")\s]+)/gi)) external.add(match[1]);
  }
  if (external.size) warnings.push(`External resources will not load in engines or <img>: ${[...external].slice(0, 3).join(', ')}. Embed them or draw the shapes.`);

  const animated = document.getAnimations().length > 0 || !!document.querySelector('animate, animateTransform, animateMotion, set');
  const duration = Number.parseFloat(svg.getAttribute('data-duration') ?? '');
  if (animated && !(duration > 0)) warnings.push('Animated asset: set data-duration="<seconds>" (and optionally data-frames) so frames can be reviewed and exported.');
  // Browsers silently ignore SMIL animations with inconsistent timing lists, so check them here.
  for (const animation of document.querySelectorAll('animate, animateTransform, animateMotion')) {
    const list = (name) => (animation.getAttribute(name) ?? '').split(';').map((part) => part.trim()).filter(Boolean);
    const [values, keyTimes, keySplines] = [list('values'), list('keyTimes'), list('keySplines')];
    const mode = animation.getAttribute('calcMode') ?? (animation.localName === 'animateMotion' ? 'paced' : 'linear');
    const where = `<${animation.localName} attributeName="${animation.getAttribute('attributeName') ?? ''}"> in #${animation.parentElement?.id || animation.parentElement?.localName}`;
    const problems = [];
    if (keyTimes.length && values.length && keyTimes.length !== values.length) problems.push(`${values.length} values but ${keyTimes.length} keyTimes`);
    if (keyTimes.length && Number(keyTimes[0]) !== 0) problems.push('keyTimes must start at 0');
    if (keyTimes.length && mode !== 'discrete' && Number(keyTimes.at(-1)) !== 1) problems.push('keyTimes must end at 1');
    if (mode === 'spline' && keySplines.length !== Math.max(0, (keyTimes.length || values.length) - 1)) problems.push(`calcMode="spline" needs ${Math.max(0, (keyTimes.length || values.length) - 1)} keySplines, found ${keySplines.length}`);
    if (problems.length) errors.push(`${where}: ${problems.join('; ')}. The browser ignores this animation entirely.`);
  }

  let nineSlice = null;
  const slice = (svg.getAttribute('data-nine-slice') ?? '').trim();
  if (slice) {
    const values = slice.split(/[\s,]+/).map(Number);
    if (values.length > 4 || values.some((value) => !(value >= 0))) errors.push('data-nine-slice must be 1-4 non-negative numbers: "top right bottom left".');
    else {
      const [top, right = top, bottom = top, left = right] = values;
      nineSlice = [top, right, bottom, left];
      if (top + bottom >= height || left + right >= width) errors.push('data-nine-slice insets overlap: the stretchable centre must be larger than 0.');
    }
  }

  let bounds = null;
  try {
    const content = svg.getBBox();
    const sx = hasViewBox ? width / box.width : 1;
    const sy = hasViewBox ? height / box.height : 1;
    const ox = hasViewBox ? box.x : 0;
    const oy = hasViewBox ? box.y : 0;
    const left = (content.x - ox) * sx;
    const top = (content.y - oy) * sy;
    bounds = {
      left: Math.round(left),
      top: Math.round(top),
      right: Math.round(width - left - content.width * sx),
      bottom: Math.round(height - top - content.height * sy),
      fill: Math.round(((content.width * sx * content.height * sy) / (width * height)) * 100) / 100
    };
  } catch {
    // empty document
  }
  if (bounds && (type === 'icon' || type === 'vfx')) {
    if (Math.min(bounds.left, bounds.top, bounds.right, bounds.bottom) < 2) warnings.push('Content touches the canvas edge: outlines, glows and shadows will clip. Leave at least 4px of padding.');
    if (type === 'icon' && bounds.fill < 0.4) warnings.push(`Content covers only ${Math.round(bounds.fill * 100)}% of the canvas; an icon should fill about 80-90% of its box.`);
  }
  if (['button', 'panel', 'frame', 'bar'].includes(type) && document.querySelector('text')) {
    warnings.push('UI chrome contains <text>: labels are rendered and localized by the engine. Keep the art textless unless it is a logo.');
  }
  return {
    meta: {
      width,
      height,
      type,
      style: svg.getAttribute('data-style') ?? '',
      animated,
      duration: duration > 0 ? duration : 0,
      frames: Number.parseInt(svg.getAttribute('data-frames') ?? '', 10) || 0,
      nineSlice,
      bounds,
      elements: all.length
    },
    errors,
    warnings
  };
}

function seekInPage(time) {
  const svg = document.documentElement;
  svg.pauseAnimations?.();
  svg.setCurrentTime?.(time);
  for (const animation of document.getAnimations()) {
    animation.pause();
    animation.currentTime = time * 1000;
  }
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function resizeInPage(scale) {
  const svg = document.documentElement;
  svg.setAttribute('width', String(svg.width.baseVal.value * scale));
  svg.setAttribute('height', String(svg.height.baseVal.value * scale));
}

/**
 * Open an SVG file as its own document, lint it, then screenshot it.
 * `scale` is explicit; otherwise `fit` is the target size of the longer side (capped at 2x).
 * `times` are seconds; one transparent PNG is returned per time.
 */
export function captureAsset(file, { id, scale, fit = 0, times = [0] }) {
  return withPage(async (page) => {
    await page.goto(pathToFileURL(file).href);
    const report = await page.evaluate(lintInPage, { id, types: ASSET_TYPES });
    if (report.fatal || !times.length) return { report, frames: [], scale: 1 };
    const { width, height } = report.meta;
    const factor = scale ?? Math.min(2, Math.max(0.25, fit / Math.max(width, height)));
    if (factor !== 1) await page.evaluate(resizeInPage, factor);
    await page.setViewportSize({ width: Math.ceil(width * factor), height: Math.ceil(height * factor) });
    await page.evaluate(() => document.fonts?.ready);
    const frames = [];
    for (const time of times) {
      await page.evaluate(seekInPage, time);
      frames.push(await page.screenshot({ omitBackground: true }));
    }
    return { report, frames, scale: factor };
  });
}

const PAGE_STYLE = `
  body { margin: 0; background: #131417; color: #9aa0ab; font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; }
  main { display: inline-flex; flex-direction: column; gap: 14px; padding: 16px; }
  .row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; max-width: 1180px; }
  figure { margin: 0; display: flex; flex-direction: column; gap: 6px; }
  .box { display: grid; place-items: center; }
  .checker { background: conic-gradient(#2c3038 25%, #23262c 0 50%, #2c3038 0 75%, #23262c 0) 0 0 / 16px 16px; }
  .dark { background: #0b0c0e; }
  .light { background: #e8e4dc; }
  .gray img { filter: grayscale(1); }
  b { color: #e4e6ea; font-weight: 600; }
`;

const png = (buffer) => `data:image/png;base64,${buffer.toString('base64')}`;

function fitImage(buffer, width, height, box) {
  const factor = Math.min(box / width, box / height);
  return `<img src="${png(buffer)}" style="width:${width * factor}px;height:${height * factor}px">`;
}

function shoot(body) {
  return withPage(async (page) => {
    await page.setContent(`<!doctype html><style>${PAGE_STYLE}</style><main>${body}</main>`);
    return page.locator('main').screenshot({ type: 'jpeg', quality: 84 });
  });
}

/** One asset: render + grayscale value check + small-size readability + animation strip. */
export function reviewSheet({ id, meta, main, scale, frames = [], times = [] }) {
  const width = meta.width * scale;
  const height = meta.height * scale;
  const figure = (className, content, caption) => `<figure><div class="box ${className}" style="width:${width}px;height:${height}px">${content}</div><figcaption>${caption}</figcaption></figure>`;
  const image = `<img src="${png(main)}" style="width:${width}px;height:${height}px">`;
  const small = (className, box) => `<div class="box ${className}" style="width:${box + 16}px;height:${box + 16}px">${fitImage(main, width, height, box)}</div>`;
  const strip = frames.length
    ? `<div class="row">${frames.map((frame, index) => `<figure><div class="box checker" style="width:128px;height:128px">${fitImage(frame, width, height, 128)}</div><figcaption>t=${times[index].toFixed(2)}s</figcaption></figure>`).join('')}</div>`
    : '';
  return shoot(`
    <div><b>${id}</b> · ${meta.type || 'no type'} · ${meta.width}×${meta.height}${meta.duration ? ` · ${meta.duration}s` : ''} · shown at ${Math.round(scale * 100)}%</div>
    <div class="row">
      ${figure('checker', image, 'render')}
      ${figure('checker gray', image, 'value check (grayscale)')}
      <figure><div class="row" style="gap:8px">${small('dark', 64)}${small('light', 64)}${small('dark', 32)}</div><figcaption>64px / 32px readability</figcaption></figure>
    </div>
    ${strip}`);
}

/** Several assets side by side, for checking a set's consistency. */
export function contactSheet(items) {
  return shoot(`<div class="row">${items
    .map(({ id, meta, frame }) => `<figure><div class="box checker" style="width:220px;height:220px">${fitImage(frame, meta.width, meta.height, 204)}</div><figcaption><b>${id}</b><br>${meta.type} · ${meta.width}×${meta.height}</figcaption></figure>`)
    .join('')}</div>`);
}

/** Pack equally sized frames into a transparent PNG grid. */
export function spriteSheet(frames, frameWidth, frameHeight) {
  const columns = Math.ceil(Math.sqrt(frames.length));
  const rows = Math.ceil(frames.length / columns);
  const viewport = { width: columns * frameWidth, height: rows * frameHeight };
  return withPage(async (page) => {
    await page.setContent(`<!doctype html><body style="margin:0"><main style="display:grid;grid-template-columns:repeat(${columns},${frameWidth}px);grid-auto-rows:${frameHeight}px;width:${viewport.width}px">${frames
      .map((frame) => `<img src="${png(frame)}" style="width:${frameWidth}px;height:${frameHeight}px;display:block">`)
      .join('')}</main></body>`);
    const image = await page.locator('main').screenshot({ type: 'png', omitBackground: true });
    return { image, columns, rows };
  }, viewport);
}

const HEX = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;

function hexes(text) {
  return [...text.matchAll(HEX)].map(([, value]) => (value.length === 3 ? [...value].map((part) => part + part).join('') : value).toLowerCase());
}

function distance(a, b) {
  const [r1, g1, b1] = [0, 2, 4].map((offset) => Number.parseInt(a.slice(offset, offset + 2), 16));
  const [r2, g2, b2] = [0, 2, 4].map((offset) => Number.parseInt(b.slice(offset, offset + 2), 16));
  const mean = (r1 + r2) / 2;
  // "redmean" perceptual approximation, scaled to roughly 0-255
  return Math.sqrt((2 + mean / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - mean) / 256) * (b1 - b2) ** 2) / 3;
}

/** Colors in the SVG that are not close to any hex code listed in the art bible. */
export function offPalette(svg, artBible) {
  const palette = [...new Set(hexes(artBible))];
  if (palette.length < 3) return [];
  return [...new Set(hexes(svg))]
    .map((color) => {
      const nearest = palette.reduce((best, candidate) => (distance(color, candidate) < distance(color, best) ? candidate : best));
      return { color, nearest, gap: distance(color, nearest) };
    })
    .filter(({ gap }) => gap > 20)
    .map(({ color, nearest }) => `#${color} (nearest #${nearest})`);
}
