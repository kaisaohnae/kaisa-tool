import {
  canvasToBlob,
  drawImageToCanvas,
  flattenOnWhite,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export type StrokeType = 'rect' | 'line';

export interface StrokeShape {
  type: StrokeType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  lineWidth: number;
}

export function normalizeStrokeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Pick<StrokeShape, 'x1' | 'y1' | 'x2' | 'y2'> {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  return {x1: left, y1: top, x2: right, y2: bottom};
}

export function strokeDistance(shape: Pick<StrokeShape, 'x1' | 'y1' | 'x2' | 'y2'>): number {
  const dx = shape.x2 - shape.x1;
  const dy = shape.y2 - shape.y1;
  return Math.hypot(dx, dy);
}

export function isValidStroke(shape: StrokeShape): boolean {
  if (shape.type === 'line') return strokeDistance(shape) >= 2;
  return Math.abs(shape.x2 - shape.x1) >= 2 && Math.abs(shape.y2 - shape.y1) >= 2;
}

export async function applyStrokes(
  file: File,
  strokes: StrokeShape[],
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

    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}
