import {
  canvasToBlob,
  drawImageToCanvas,
  flattenOnWhite,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';
import {normalizeStrokeRect, type StrokeShape} from '@/modules/image/stroke';
import {drawTextLayer, type TextLayer} from '@/modules/image/text';

export async function applyAnnotations(
  file: File,
  strokes: StrokeShape[],
  texts: TextLayer[],
  mime: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');

    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';

      if (stroke.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(stroke.x1, stroke.y1);
        ctx.lineTo(stroke.x2, stroke.y2);
        ctx.stroke();
      } else {
        const {x1, y1, x2, y2} = normalizeStrokeRect(stroke.x1, stroke.y1, stroke.x2, stroke.y2);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    }

    for (const layer of texts) {
      drawTextLayer(ctx, layer);
    }

    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}
