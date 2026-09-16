import {createLayerCanvas, getOpaqueBounds} from './canvas';
import type {PhotoSelection, SelectionShape} from './types';

export function boundsFromPoints(points: {x: number; y: number}[]) {
  if (!points.length) return {x: 0, y: 0, w: 0, h: 0};
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

export function normalizeSelection(sel: PhotoSelection): PhotoSelection {
  if (sel.shape === 'lasso') return {...sel, ...boundsFromPoints(sel.points ?? [])};
  const x = sel.w < 0 ? sel.x + sel.w : sel.x, y = sel.h < 0 ? sel.y + sel.h : sel.y;
  return {...sel, x, y, w: Math.abs(sel.w), h: Math.abs(sel.h)};
}

export function rectFromDrag(x1: number, y1: number, x2: number, y2: number, boundsW: number, boundsH: number, shape: SelectionShape, options: {square?: boolean; fromCenter?: boolean} = {}): PhotoSelection {
  x1 = Math.max(0, Math.min(boundsW, x1)); y1 = Math.max(0, Math.min(boundsH, y1));
  let dx = x2 - x1, dy = y2 - y1;
  const sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
  const limitX = options.fromCenter ? Math.min(x1, boundsW - x1) : sx < 0 ? x1 : boundsW - x1;
  const limitY = options.fromCenter ? Math.min(y1, boundsH - y1) : sy < 0 ? y1 : boundsH - y1;
  if (options.square) {
    const side = Math.min(Math.max(Math.abs(dx), Math.abs(dy)), limitX, limitY);
    dx = sx * side; dy = sy * side;
  } else {dx = sx * Math.min(Math.abs(dx), limitX); dy = sy * Math.min(Math.abs(dy), limitY);}
  const x = options.fromCenter ? x1 - Math.abs(dx) : Math.min(x1, x1 + dx);
  const y = options.fromCenter ? y1 - Math.abs(dy) : Math.min(y1, y1 + dy);
  return {shape, x, y, w: Math.abs(dx) * (options.fromCenter ? 2 : 1), h: Math.abs(dy) * (options.fromCenter ? 2 : 1)};
}

export function blendMaskedPixels(before: Uint8ClampedArray, after: Uint8ClampedArray, mask: Uint8ClampedArray) {
  for (let i = 0; i < before.length; i += 4) {
    const weight = mask[i + 3] / 255;
    if (!weight) continue;
    const a = before[i + 3] / 255, b = after[i + 3] / 255;
    const alpha = a * (1 - weight) + b * weight;
    for (let c = 0; c < 3; c++) before[i + c] = alpha ? (before[i + c] * a * (1 - weight) + after[i + c] * b * weight) / alpha : 0;
    before[i + 3] = alpha * 255;
  }
}
export function pathFromSelection(ctx: CanvasRenderingContext2D, sel: PhotoSelection) {
  ctx.beginPath();
  if (sel.shape === 'ellipse') ctx.ellipse(sel.x + sel.w / 2, sel.y + sel.h / 2, Math.max(.5, sel.w / 2), Math.max(.5, sel.h / 2), 0, 0, Math.PI * 2);
  else if (sel.shape === 'lasso' && sel.points?.length) {
    ctx.moveTo(sel.points[0].x, sel.points[0].y);
    sel.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
  } else ctx.rect(sel.x, sel.y, sel.w, sel.h);
}

export function selectionToMask(sel: PhotoSelection, width: number, height: number) {
  const mask = createLayerCanvas(width, height);
  const ctx = mask.getContext('2d');
  if (ctx) { ctx.fillStyle = '#fff'; pathFromSelection(ctx, sel); ctx.fill(); }
  return mask;
}

export function invertSelectionMask(mask: HTMLCanvasElement) {
  const ctx = mask.getContext('2d', {willReadFrequently: true}); if (!ctx) return mask;
  const image = ctx.getImageData(0, 0, mask.width, mask.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 255 - image.data[i + 3];
    image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
    image.data[i + 3] = value;
  }
  ctx.putImageData(image, 0, 0); maskOutlines.delete(mask); return mask;
}

function clipSelection(ctx: CanvasRenderingContext2D, sel: PhotoSelection | null) {
  if (sel) { pathFromSelection(ctx, sel); ctx.clip(); }
}

export function clearSelectionArea(canvas: HTMLCanvasElement, sel: PhotoSelection | null, mask?: HTMLCanvasElement | null) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  if (mask) {
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(mask, 0, 0); ctx.restore();
  } else {
    ctx.save(); clipSelection(ctx, sel); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore();
  }
}

export function fillSelectionArea(
  canvas: HTMLCanvasElement, sel: PhotoSelection | null, color: string, mask?: HTMLCanvasElement | null, alpha = 1, preserveTransparency = false
) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  if (mask) {
    const fill = createLayerCanvas(canvas.width, canvas.height);
    const fillCtx = fill.getContext('2d');
    if (!fillCtx) return;
    fillCtx.globalAlpha = alpha;
    fillCtx.fillStyle = color; fillCtx.fillRect(0, 0, fill.width, fill.height);
    fillCtx.globalAlpha = 1;
    fillCtx.globalCompositeOperation = 'destination-in'; fillCtx.drawImage(mask, 0, 0);
    ctx.save();
    if (preserveTransparency) ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(fill, 0, 0);
    ctx.restore();
  } else {
    ctx.save(); clipSelection(ctx, sel); if (preserveTransparency) ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
  }
}

// Runs `draw` clipped to the active selection (raster mask when one exists, e.g. from a
// lasso/wand selection, or the selection's own path otherwise). Used by tools like the
// gradient tool that need to stay inside the selection instead of painting the whole canvas.
export function withSelectionClip(
  canvas: HTMLCanvasElement,
  sel: PhotoSelection | null,
  mask: HTMLCanvasElement | null | undefined,
  draw: (ctx: CanvasRenderingContext2D) => void
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (mask) {
    const layer = createLayerCanvas(canvas.width, canvas.height);
    const layerCtx = layer.getContext('2d');
    if (!layerCtx) return;
    draw(layerCtx);
    layerCtx.globalCompositeOperation = 'destination-in';
    layerCtx.drawImage(mask, 0, 0);
    ctx.drawImage(layer, 0, 0);
  } else if (sel) {
    ctx.save();
    clipSelection(ctx, sel);
    draw(ctx);
    ctx.restore();
  } else {
    draw(ctx);
  }
}

export function strokeSelectionArea(
  canvas: HTMLCanvasElement,
  sel: PhotoSelection,
  width: number,
  color: string,
  location: 'inside' | 'center' | 'outside' = 'center',
  alpha = 1
) {
  const ctx = canvas.getContext('2d');
  if (!ctx || width <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  if (location === 'center') {
    ctx.lineWidth = width;
    pathFromSelection(ctx, sel);
    ctx.stroke();
  } else if (location === 'inside') {
    pathFromSelection(ctx, sel);
    ctx.clip();
    ctx.lineWidth = width * 2;
    pathFromSelection(ctx, sel);
    ctx.stroke();
  } else {
    // Clip to "outside the selection": a donut made from the full canvas rect minus the
    // selection shape via the even-odd fill rule, then stroke centered on the boundary so
    // only the outer half (which the clip lets through) ends up visible.
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    pathFromSelection(ctx, sel);
    ctx.clip('evenodd');
    ctx.lineWidth = width * 2;
    pathFromSelection(ctx, sel);
    ctx.stroke();
  }
  ctx.restore();
}

export function copySelectionArea(source: HTMLCanvasElement, sel: PhotoSelection, mask?: HTMLCanvasElement | null) {
  const clip = createLayerCanvas(Math.max(1, Math.round(sel.w)), Math.max(1, Math.round(sel.h)));
  const ctx = clip.getContext('2d'); if (!ctx) return clip;
  ctx.save(); ctx.translate(-sel.x, -sel.y);
  if (!mask) clipSelection(ctx, sel);
  ctx.drawImage(source, 0, 0);
  if (mask) { ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0); }
  ctx.restore();
  return clip;
}

export function magicWandBounds(canvas: HTMLCanvasElement, startX: number, startY: number, tolerance = 32): PhotoSelection | null {
  const ctx = canvas.getContext('2d', {willReadFrequently: true}); if (!ctx) return null;
  const {width, height} = canvas, x0 = Math.floor(startX), y0 = Math.floor(startY);
  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return null;
  const data = ctx.getImageData(0, 0, width, height).data, i0 = (y0 * width + x0) * 4;
  const target = [data[i0], data[i0 + 1], data[i0 + 2], data[i0 + 3]], seen = new Uint8Array(width * height), stack = [x0, y0];
  let minX = width, minY = height, maxX = -1, maxY = -1;
  while (stack.length) {
    const y = stack.pop()!, x = stack.pop()!, p = y * width + x, i = p * 4;
    if (x < 0 || y < 0 || x >= width || y >= height || seen[p] || target.some((v, c) => Math.abs(data[i + c] - v) > tolerance)) continue;
    seen[p] = 1; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
  }
  return maxX < 0 ? null : {shape: 'rect', x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1};
}

export function selectionFromLayerAlpha(canvas: HTMLCanvasElement) {
  const bounds = getOpaqueBounds(canvas);
  if (!bounds) return null;
  const mask = createLayerCanvas(canvas.width, canvas.height);
  const ctx = mask.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, mask.width, mask.height);
  ctx.globalCompositeOperation = 'source-over';
  return {selection: {shape: 'rect' as const, ...bounds}, mask};
}
const maskOutlines = new WeakMap<HTMLCanvasElement, Path2D>();
export function selectionMaskOutline(mask: HTMLCanvasElement) {
  const cached = maskOutlines.get(mask);
  if (cached) return cached;
  const path = new Path2D();
  const data = mask.getContext('2d')?.getImageData(0, 0, mask.width, mask.height).data;
  if (!data) return path;
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < mask.width && y < mask.height && data[(y * mask.width + x) * 4 + 3] >= 128;
  // Join pixel edges into continuous contours so the dash phase does not restart each pixel.
  const stride = mask.width + 1;
  const edges = new Map<number, number[]>();
  const edge = (x: number, y: number, x2: number, y2: number) => {
    const start = y * stride + x, end = y2 * stride + x2;
    const next = edges.get(start) ?? [];
    next.push(end); edges.set(start, next);
  };
  for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) {
    if (!filled(x, y)) continue;
    if (!filled(x, y - 1)) edge(x, y, x + 1, y);
    if (!filled(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
    if (!filled(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
    if (!filled(x - 1, y)) edge(x, y + 1, x, y);
  }
  while (edges.size) {
    const start = edges.keys().next().value!;
    let vertex = start;
    path.moveTo(vertex % stride, Math.floor(vertex / stride));
    do {
      const outgoing = edges.get(vertex);
      if (!outgoing?.length) break;
      const next = outgoing.pop()!;
      if (!outgoing.length) edges.delete(vertex);
      vertex = next;
      path.lineTo(vertex % stride, Math.floor(vertex / stride));
    } while (vertex !== start);
    if (vertex === start) path.closePath();
  }
  maskOutlines.set(mask, path);
  return path;
}