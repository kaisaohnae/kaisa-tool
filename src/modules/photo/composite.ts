import {applyAdjustment} from './adjust';
import {applyMaskToCanvas, createLayerCanvas} from './canvas';
import {drawTextLayer} from './text';
import {DEFAULT_ADJUSTMENT, type AdjustmentParams, type AdjustmentType, type BlendMode, type TextLayerData} from './types';

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
};

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
    if (layer.kind === 'text') {
      if (!layer.text) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
      ctx.globalCompositeOperation = (layer.blendMode ?? 'source-over') as GlobalCompositeOperation;
      drawTextLayer(ctx, layer.text);
      ctx.restore();
      continue;
    }
    if (!layer.canvas) continue;
    const draw = layer.mask ? applyMaskToCanvas(layer.canvas, layer.mask) : layer.canvas;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    ctx.globalCompositeOperation = (layer.blendMode ?? 'source-over') as GlobalCompositeOperation;
    ctx.drawImage(draw, 0, 0); ctx.restore();
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
