import {createLayerCanvas} from './canvas';
import {hexToRgba} from './color';
import type {ShapeMode, ShapeStyle} from './types';

export function drawBrushStroke(
  ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number,
  size: number, color: string, erase = false, hardness = 100, opacity = 1
) {
  const radius = Math.max(0.5, size / 2);
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const count = Math.max(1, Math.ceil(distance / Math.max(radius * 0.25, 1)));
  const inner = radius * Math.max(0, Math.min(100, hardness)) / 100;
  const [r, g, b] = hexToRgba(color);
  ctx.save();
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  for (let i = 0; i <= count; i++) {
    const t = distance < 0.5 ? 1 : i / count;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    const gradient = ctx.createRadialGradient(x, y, inner, x, y, radius);
    gradient.addColorStop(0, erase ? '#000' : `rgb(${r} ${g} ${b})`);
    gradient.addColorStop(1, erase ? 'transparent' : `rgb(${r} ${g} ${b} / 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCloneStroke(
  destCtx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement,
  fromX: number, fromY: number, toX: number, toY: number, size: number,
  offsetX: number, offsetY: number, hardness = 80, opacity = 1
) {
  const radius = Math.max(0.5, size / 2);
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const count = Math.max(1, Math.ceil(distance / Math.max(radius * 0.35, 1)));
  const stamp = createLayerCanvas(Math.ceil(radius * 2 + 2), Math.ceil(radius * 2 + 2));
  const stampCtx = stamp.getContext('2d');
  if (!stampCtx) return;
  for (let i = 0; i <= count; i++) {
    const t = distance < 0.5 ? 1 : i / count;
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    stampCtx.clearRect(0, 0, stamp.width, stamp.height);
    stampCtx.drawImage(sourceCanvas, x + offsetX - radius, y + offsetY - radius, radius * 2, radius * 2, 0, 0, radius * 2, radius * 2);
    const mask = destCtx.createRadialGradient(x, y, radius * hardness / 100, x, y, radius);
    mask.addColorStop(0, 'rgb(0 0 0)');
    mask.addColorStop(1, 'transparent');
    destCtx.save();
    destCtx.beginPath(); destCtx.arc(x, y, radius, 0, Math.PI * 2); destCtx.clip();
    destCtx.globalAlpha = opacity;
    destCtx.drawImage(stamp, x - radius, y - radius);
    destCtx.globalCompositeOperation = 'destination-in';
    destCtx.globalAlpha = 1;
    destCtx.fillStyle = mask;
    destCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    destCtx.restore();
  }
}

export function drawLinearGradient(canvas: HTMLCanvasElement, x1: number, y1: number, x2: number, y2: number, colorA: string, colorB: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, colorA); gradient.addColorStop(1, colorB);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function floodFill(canvas: HTMLCanvasElement, startX: number, startY: number, fillHex: string, tolerance = 24) {
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  if (!ctx) return;
  const {width, height} = canvas, x0 = Math.floor(startX), y0 = Math.floor(startY);
  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return;
  const image = ctx.getImageData(0, 0, width, height), data = image.data, start = (y0 * width + x0) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const fill = hexToRgba(fillHex);
  const seen = new Uint8Array(width * height), stack = [x0, y0];
  const matches = (i: number) => target.every((v, c) => Math.abs(data[i + c] - v) <= tolerance);
  while (stack.length) {
    const y = stack.pop()!, x = stack.pop()!, p = y * width + x, i = p * 4;
    if (x < 0 || y < 0 || x >= width || y >= height || seen[p] || !matches(i)) continue;
    seen[p] = 1; data.set(fill, i);
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
  }
  ctx.putImageData(image, 0, 0);
}

export function drawTextOnCanvas(canvas: HTMLCanvasElement, text: string, x: number, y: number, color: string, fontSize: number, bold = true) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !text.trim()) return;
  ctx.save(); ctx.fillStyle = color; ctx.font = `${bold ? 'bold ' : ''}${Math.max(8, fontSize)}px sans-serif`;
  ctx.textBaseline = 'top'; ctx.fillText(text, x, y); ctx.restore();
}

export function clearRect(canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number) {
  canvas.getContext('2d')?.clearRect(x, y, w, h);
}

export function fillRect(canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, color: string) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
}

export function drawShape(
  canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, mode: ShapeMode,
  style: ShapeStyle, fill: string, stroke: string, strokeWidth: number
) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.beginPath();
  if (mode === 'ellipse') ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
  else if (mode === 'rounded') ctx.roundRect(x, y, w, h, Math.min(24, Math.abs(w) / 4, Math.abs(h) / 4));
  else ctx.rect(x, y, w, h);
  if (style !== 'stroke') { ctx.fillStyle = fill; ctx.fill(); }
  if (style !== 'fill') { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, strokeWidth); ctx.stroke(); }
  ctx.restore();
}
