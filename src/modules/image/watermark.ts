import {
  canvasToBlob,
  drawImageToCanvas,
  flattenOnWhite,
  getLoadedSize,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export interface TextWatermarkOptions {
  content: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  angle?: number;
  tile?: boolean;
}

export interface ImageWatermarkOptions {
  file: File;
  scale: number;
  opacity: number;
  position: WatermarkPosition;
}

function positionOrigin(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  itemW: number,
  itemH: number,
  margin = 24
): {x: number; y: number} {
  switch (position) {
    case 'top-left':
      return {x: margin, y: margin};
    case 'top-right':
      return {x: canvasW - itemW - margin, y: margin};
    case 'bottom-left':
      return {x: margin, y: canvasH - itemH - margin};
    case 'bottom-right':
      return {x: canvasW - itemW - margin, y: canvasH - itemH - margin};
    case 'center':
    default:
      return {x: (canvasW - itemW) / 2, y: (canvasH - itemH) / 2};
  }
}

function drawTextWatermark(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, opts: TextWatermarkOptions) {
  const content = opts.content.trim();
  if (!content) return;

  const fontSize = Math.max(8, Math.min(512, Math.round(opts.fontSize)));
  const opacity = Math.min(1, Math.max(0, opts.opacity));
  const angle = ((opts.angle ?? 0) * Math.PI) / 180;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = opts.color || '#ffffff';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  const metrics = ctx.measureText(content);
  const textW = Math.max(1, metrics.width);
  const textH = fontSize * 1.2;

  if (opts.tile) {
    const gapX = textW + fontSize * 2;
    const gapY = textH + fontSize * 2;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    for (let y = -canvas.height; y < canvas.height * 2; y += gapY) {
      for (let x = -canvas.width; x < canvas.width * 2; x += gapX) {
        ctx.fillText(content, x - canvas.width / 2, y - canvas.height / 2);
      }
    }
  } else {
    const {x, y} = positionOrigin(opts.position, canvas.width, canvas.height, textW, textH);
    ctx.translate(x + textW / 2, y + textH / 2);
    ctx.rotate(angle);
    ctx.fillText(content, -textW / 2, -textH / 2);
  }
  ctx.restore();
}

async function drawImageWatermark(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, opts: ImageWatermarkOptions) {
  const mark = await loadImageFromFile(opts.file);
  try {
    const size = getLoadedSize(mark);
    const scale = Math.min(2, Math.max(0.05, opts.scale));
    const w = Math.max(1, Math.round(size.width * scale));
    const h = Math.max(1, Math.round(size.height * scale));
    const {x, y} = positionOrigin(opts.position, canvas.width, canvas.height, w, h);
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, opts.opacity));
    ctx.drawImage(mark, x, y, w, h);
    ctx.restore();
  } finally {
    releaseLoadedImage(mark);
  }
}

export async function applyWatermark(
  file: File,
  text?: TextWatermarkOptions | null,
  image?: ImageWatermarkOptions | null,
  mime: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
): Promise<Blob> {
  if (!text?.content?.trim() && !image?.file) {
    throw new Error('Enter a text or image watermark.');
  }

  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');

    if (text?.content?.trim()) drawTextWatermark(ctx, canvas, text);
    if (image?.file) await drawImageWatermark(ctx, canvas, image);

    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}
