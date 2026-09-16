import {createLayerCanvas} from './canvas';
import {hexToRgba} from './color';
import {withSelectionClip, blendMaskedPixels} from './selection';
import type {PenAnchor, ShapeMode, ShapeStyle} from './types';
import type {PhotoSelection} from './types';

export type BrushTip = 'round' | 'square' | 'calligraphy' | 'spray' | 'texture';
export type BrushStrokeState = {distanceToNext: number};
export type BrushTipOptions = {tip?: BrushTip; angle?: number; spacing?: number; stroke?: BrushStrokeState; selection?: PhotoSelection | null; mask?: HTMLCanvasElement | null};

export function drawBrushStroke(
  ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number,
  size: number, color: string, erase = false, hardness = 100, opacity = 1, options: BrushTipOptions = {}
) {
  if (options.mask) {
    const padding = Math.max(2, size);
    const left = Math.max(0, Math.floor(Math.min(fromX, toX) - padding));
    const top = Math.max(0, Math.floor(Math.min(fromY, toY) - padding));
    const width = Math.min(ctx.canvas.width, Math.ceil(Math.max(fromX, toX) + padding)) - left;
    const height = Math.min(ctx.canvas.height, Math.ceil(Math.max(fromY, toY) + padding)) - top;
    if (width <= 0 || height <= 0) return;
    const original = ctx.getImageData(left, top, width, height);
    const region = createLayerCanvas(width, height), regionCtx = region.getContext('2d');
    const maskCtx = options.mask.getContext('2d');
    if (!regionCtx || !maskCtx) return;
    regionCtx.putImageData(original, 0, 0);
    drawBrushStroke(regionCtx, fromX - left, fromY - top, toX - left, toY - top, size, color, erase, hardness, opacity, {...options, mask: null, selection: null});
    blendMaskedPixels(original.data, regionCtx.getImageData(0,0,width,height).data, maskCtx.getImageData(left,top,width,height).data);
    ctx.putImageData(original, left, top);
    return;
  }
  if (options.selection) {
    withSelectionClip(ctx.canvas, options.selection, null, selectedCtx => drawBrushStroke(selectedCtx, fromX, fromY, toX, toY, size, color, erase, hardness, opacity, {...options, selection: null}));
    return;
  }
  const radius = Math.max(.5, size / 2);
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const spacing = Math.max(.5, size * Math.max(1, Math.min(200, options.spacing ?? 12.5)) / 100);
  const inner = Math.min(radius - .01, radius * Math.max(0, Math.min(100, hardness)) / 100);
  const [r, g, b] = hexToRgba(color);
  const tip = options.tip ?? 'round';
  const solid = erase ? '#000' : `rgb(${r} ${g} ${b})`;
  let offset = options.stroke?.distanceToNext ?? 0;
  ctx.save();
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  for (; offset <= distance + 1e-6; offset += spacing) {
    const t = distance === 0 ? 0 : offset / distance;
    ctx.save();
    ctx.translate(fromX + (toX - fromX) * t, fromY + (toY - fromY) * t);
    ctx.rotate((options.angle ?? 0) * Math.PI / 180);
    if (tip === 'square') {
      ctx.fillStyle = solid;
      ctx.filter = `blur(${(100 - hardness) / 100 * radius * .2}px)`;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    } else if (tip === 'spray' || tip === 'texture') {
      ctx.fillStyle = solid;
      const dots = tip === 'spray' ? Math.max(16, Math.min(180, size * 2)) : 60;
      for (let dot = 0; dot < dots; dot++) {
        // Texture keeps the same bristle arrangement; spray scatters each impression.
        const a = tip === 'texture' ? dot * 2.399963 : Math.random() * Math.PI * 2;
        const d = tip === 'texture' ? radius * Math.sqrt((dot + .5) / dots) : radius * Math.sqrt(Math.random());
        const feather = d <= inner ? 1 : Math.max(0, (radius - d) / Math.max(.01, radius - inner));
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity)) * feather;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, Math.max(.45, radius * (tip === 'spray' ? .025 : .07)), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      if (tip === 'calligraphy') ctx.scale(1, .28);
      const gradient = ctx.createRadialGradient(0, 0, Math.max(0, inner), 0, 0, radius);
      gradient.addColorStop(0, solid);
      gradient.addColorStop(1, erase ? 'transparent' : `rgb(${r} ${g} ${b} / 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  if (options.stroke) options.stroke.distanceToNext = offset - distance;
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
    // Same degenerate-gradient guard as drawBrushStroke: keep the inner radius strictly below
    // the outer one so a hardness of 100 (the default) doesn't silently paint nothing.
    const innerRadius = Math.min(radius - 0.01, radius * hardness / 100);
    const mask = destCtx.createRadialGradient(x, y, innerRadius, x, y, radius);
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

export function drawLinearGradient(
  canvas: HTMLCanvasElement, x1: number, y1: number, x2: number, y2: number, colorA: string, colorB: string,
  sel?: PhotoSelection | null, mask?: HTMLCanvasElement | null, alphaA = 1, alphaB = 1
) {
  withSelectionClip(canvas, sel ?? null, mask, ctx => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const [ra, ga, ba] = hexToRgba(colorA);
    const [rb, gb, bb] = hexToRgba(colorB);
    gradient.addColorStop(0, `rgba(${ra}, ${ga}, ${ba}, ${Math.max(0, Math.min(1, alphaA))})`);
    gradient.addColorStop(1, `rgba(${rb}, ${gb}, ${bb}, ${Math.max(0, Math.min(1, alphaB))})`);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

export function floodFill(
  canvas: HTMLCanvasElement, startX: number, startY: number, fillHex: string, tolerance = 24,
  mask?: HTMLCanvasElement | null, alpha = 255
) {
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  if (!ctx) return;
  const {width, height} = canvas, x0 = Math.floor(startX), y0 = Math.floor(startY);
  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return;
  // When a selection is active, stay inside it: pixels outside the mask are never filled,
  // and clicking outside the selection does nothing (matches Photoshop's bucket-fill behavior).
  let maskData: Uint8ClampedArray | null = null;
  if (mask) {
    const maskCtx = mask.getContext('2d', {willReadFrequently: true});
    maskData = maskCtx ? maskCtx.getImageData(0, 0, width, height).data : null;
    if (maskData && maskData[(y0 * width + x0) * 4 + 3] < 8) return;
  }
  const image = ctx.getImageData(0, 0, width, height), data = image.data, start = (y0 * width + x0) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const fill = hexToRgba(fillHex, alpha);
  const seen = new Uint8Array(width * height), stack = [x0, y0];
  const matches = (i: number) => target.every((v, c) => Math.abs(data[i + c] - v) <= tolerance);
  const inMask = (p: number) => !maskData || maskData[p * 4 + 3] >= 8;
  while (stack.length) {
    const y = stack.pop()!, x = stack.pop()!, p = y * width + x, i = p * 4;
    if (x < 0 || y < 0 || x >= width || y >= height || seen[p] || !matches(i) || !inMask(p)) continue;
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

// Traces a pen path (straight segments where an anchor has no handle, cubic bezier curves where
// it does) onto an already-open canvas path. Each anchor's `handle` is the absolute position of
// its forward curve handle; the backward handle used by the segment behind it is that point
// mirrored through the anchor, so a single dragged handle makes a smooth curve on both sides.
export function tracePenPath(ctx: CanvasRenderingContext2D, anchors: PenAnchor[], closed: boolean) {
  if (!anchors.length) return;
  ctx.moveTo(anchors[0].x, anchors[0].y);
  const segments = closed ? anchors.length : anchors.length - 1;
  for (let i = 0; i < segments; i++) {
    const a = anchors[i];
    const b = anchors[(i + 1) % anchors.length];
    const c1 = a.handle ?? {x: a.x, y: a.y};
    const c2 = b.handle ? {x: b.x * 2 - b.handle.x, y: b.y * 2 - b.handle.y} : {x: b.x, y: b.y};
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y);
  }
  if (closed) ctx.closePath();
}

export function drawVectorPath(
  canvas: HTMLCanvasElement, anchors: PenAnchor[], closed: boolean,
  style: ShapeStyle, fill: string, stroke: string, strokeWidth: number,
  sel?: PhotoSelection | null, mask?: HTMLCanvasElement | null, fillAlpha = 1, strokeAlpha = 1
) {
  if (anchors.length < 2) return;
  withSelectionClip(canvas, sel ?? null, mask, ctx => {
    ctx.beginPath();
    tracePenPath(ctx, anchors, closed);
    if (style !== 'stroke') { ctx.globalAlpha = fillAlpha; ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1; }
    if (style !== 'fill') { ctx.globalAlpha = strokeAlpha; ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, strokeWidth); ctx.stroke(); ctx.globalAlpha = 1; }
  });
}

export function drawShape(
  canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, mode: ShapeMode,
  style: ShapeStyle, fill: string, stroke: string, strokeWidth: number, fillAlpha = 1, strokeAlpha = 1, cornerRadius = 24
) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.beginPath();
  if (mode === 'ellipse') ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
  else if (mode === 'rounded') ctx.roundRect(x, y, w, h, Math.min(Number.isFinite(cornerRadius) ? Math.max(0, cornerRadius) : 24, Math.abs(w) / 2, Math.abs(h) / 2));
  else ctx.rect(x, y, w, h);
  if (style !== 'stroke') { ctx.globalAlpha = fillAlpha; ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1; }
  if (style !== 'fill') { ctx.globalAlpha = strokeAlpha; ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, strokeWidth); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.restore();
}
