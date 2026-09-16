import {applyAdjustment} from './adjust';
import {applyMaskToCanvas, createLayerCanvas} from './canvas';
import {drawTextLayer} from './text';
import {
  DEFAULT_ADJUSTMENT,
  type AdjustmentParams,
  type AdjustmentType,
  type BlendMode,
  type LayerStyle,
  type TextLayerData
} from './types';

export type CompositeLayerInput = {
  canvas?: HTMLCanvasElement;
  visible: boolean;
  opacity: number;
  kind: 'raster' | 'adjustment' | 'text';
  blendMode?: BlendMode;
  mask?: HTMLCanvasElement | null;
  adjustment?: AdjustmentType;
  adjustmentParams?: AdjustmentParams;
  text?: TextLayerData;
  style?: LayerStyle;
};

function tintedAlpha(source: HTMLCanvasElement, fill: string | CanvasGradient) {
  const canvas = createLayerCanvas(source.width, source.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function createOverlay(source: HTMLCanvasElement, style: LayerStyle['overlay']) {
  if (style.type === 'color') return tintedAlpha(source, style.color);
  const canvas = createLayerCanvas(source.width, source.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const radians = style.angle * Math.PI / 180;
  const radius = Math.abs(source.width * Math.cos(radians)) / 2 + Math.abs(source.height * Math.sin(radians)) / 2;
  const cx = source.width / 2;
  const cy = source.height / 2;
  const gradient = ctx.createLinearGradient(
    cx - Math.cos(radians) * radius,
    cy - Math.sin(radians) * radius,
    cx + Math.cos(radians) * radius,
    cy + Math.sin(radians) * radius
  );
  gradient.addColorStop(0, style.gradientStart);
  gradient.addColorStop(1, style.gradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0);
  return canvas;
}

// Expands (`dilate`) or shrinks (`erode`) a canvas's alpha shape by `radius`, approximated by
// unioning (dilate) or intersecting (erode) many copies of it shifted around a circle - the
// same "stamp in a ring" trick, just also run in reverse via destination-in for erosion.
function dilateOrErode(base: HTMLCanvasElement, radius: number, mode: 'dilate' | 'erode') {
  const samples = Math.max(12, Math.ceil(Math.max(radius, 1) * 6));
  const canvas = createLayerCanvas(base.width, base.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  if (mode === 'erode') {
    ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
  }
  for (let i = 0; i < samples; i++) {
    const angle = i / samples * Math.PI * 2;
    ctx.drawImage(base, Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  return canvas;
}

// Builds a ring shape (tinted with the border color) covering `full`'s alpha footprint minus
// `cutout`'s - used for the portion of the border that sits inside the layer's own edge.
function ringMinus(full: HTMLCanvasElement, cutout: HTMLCanvasElement) {
  const canvas = createLayerCanvas(full.width, full.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(full, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(cutout, 0, 0);
  return canvas;
}

function drawStyledLayer(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, style?: LayerStyle) {
  if (style?.dropShadow.enabled) {
    const shadow = tintedAlpha(source, style.dropShadow.color);
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, style.dropShadow.opacity));
    ctx.filter = `blur(${Math.max(0, style.dropShadow.blur)}px)`;
    ctx.drawImage(shadow, style.dropShadow.offsetX, style.dropShadow.offsetY);
    ctx.restore();
  }

  let outsideRing: HTMLCanvasElement | null = null;
  let insideRing: HTMLCanvasElement | null = null;
  if (style?.border.enabled && style.border.size > 0) {
    const size = Math.max(1, style.border.size);
    const location = style.border.location ?? 'outside';
    const tinted = tintedAlpha(source, style.border.color);
    if (location === 'outside') {
      outsideRing = dilateOrErode(tinted, size, 'dilate');
    } else if (location === 'inside') {
      const eroded = dilateOrErode(source, size, 'erode');
      insideRing = ringMinus(tinted, eroded);
    } else {
      const half = size / 2;
      outsideRing = dilateOrErode(tinted, half, 'dilate');
      const erodedHalf = dilateOrErode(source, half, 'erode');
      insideRing = ringMinus(tinted, erodedHalf);
    }
  }

  // Outside (or the outer half of a centered border) is stamped as a full halo, then covered
  // by the normal layer draw below so only the portion beyond the layer's own edge survives.
  if (outsideRing) ctx.drawImage(outsideRing, 0, 0);

  ctx.drawImage(source, 0, 0);

  // Inside (or the inner half of a centered border) is an explicit ring drawn on top, since
  // the layer draw above would otherwise cover it.
  if (insideRing) ctx.drawImage(insideRing, 0, 0);

  if (style?.overlay.enabled) {
    const overlay = createOverlay(source, style.overlay);
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, style.overlay.opacity));
    ctx.drawImage(overlay, 0, 0);
    ctx.restore();
  }
}

export function compositeLayers(width: number, height: number, layers: CompositeLayerInput[], target?: HTMLCanvasElement) {
  const out = target ?? createLayerCanvas(width, height);
  if (out.width !== width || out.height !== height) { out.width = width; out.height = height; }
  const ctx = out.getContext('2d'); if (!ctx) return out;
  ctx.clearRect(0, 0, width, height);
  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    if (layer.kind === 'adjustment') {
      const original = createLayerCanvas(width, height); original.getContext('2d')?.drawImage(out, 0, 0);
      const adjusted = applyAdjustment(original, layer.adjustment, layer.adjustmentParams ?? DEFAULT_ADJUSTMENT);
      ctx.save(); ctx.globalAlpha = layer.opacity; ctx.drawImage(adjusted, 0, 0); ctx.restore();
      continue;
    }
    let source = layer.canvas;
    if (layer.kind === 'text') {
      if (!layer.text) continue;
      const textCanvas = createLayerCanvas(width, height);
      const textCtx = textCanvas.getContext('2d');
      if (textCtx) drawTextLayer(textCtx, layer.text);
      source = textCanvas;
    }
    if (!source) continue;
    const draw = layer.mask ? applyMaskToCanvas(source, layer.mask) : source;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    ctx.globalCompositeOperation = (layer.blendMode ?? 'source-over') as GlobalCompositeOperation;
    drawStyledLayer(ctx, draw, layer.style);
    ctx.restore();
  }
  return out;
}

export function exportComposite(width: number, height: number, layers: CompositeLayerInput[], mime: 'image/png' | 'image/jpeg', quality = .92): Promise<Blob> {
  let canvas = compositeLayers(width, height, layers);
  if (mime === 'image/jpeg') {
    const flat = createLayerCanvas(width, height, '#fff'); flat.getContext('2d')?.drawImage(canvas, 0, 0); canvas = flat;
  }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Export failed')), mime, quality));
}
