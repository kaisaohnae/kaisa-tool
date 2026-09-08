import {createLayerCanvas} from './canvas';
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

export function rectFromDrag(x1: number, y1: number, x2: number, y2: number, boundsW: number, boundsH: number, shape: SelectionShape): PhotoSelection {
  const left = Math.max(0, Math.min(x1, x2)), top = Math.max(0, Math.min(y1, y2));
  const right = Math.min(boundsW, Math.max(x1, x2)), bottom = Math.min(boundsH, Math.max(y1, y2));
  return {shape, x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top)};
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
  ctx.putImageData(image, 0, 0); return mask;
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

export function fillSelectionArea(canvas: HTMLCanvasElement, sel: PhotoSelection | null, color: string, mask?: HTMLCanvasElement | null) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  if (mask) {
    const fill = createLayerCanvas(canvas.width, canvas.height);
    const fillCtx = fill.getContext('2d');
    if (!fillCtx) return;
    fillCtx.fillStyle = color; fillCtx.fillRect(0, 0, fill.width, fill.height);
    fillCtx.globalCompositeOperation = 'destination-in'; fillCtx.drawImage(mask, 0, 0);
    ctx.drawImage(fill, 0, 0);
  } else {
    ctx.save(); clipSelection(ctx, sel); ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
  }
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
