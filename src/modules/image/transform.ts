import {
  canvasToBlob,
  flattenOnWhite,
  getLoadedSize,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export type RotateDegrees = 0 | 90 | 180 | 270;
export type FlipMode = 'none' | 'horizontal' | 'vertical' | 'both';

export interface TransformOptions {
  rotate?: RotateDegrees;
  flip?: FlipMode;
  mime?: 'image/png' | 'image/jpeg';
  quality?: number;
}

export async function transformImage(file: File, options: TransformOptions = {}): Promise<Blob> {
  const rotate = options.rotate ?? 0;
  const flip = options.flip ?? 'none';
  const mime = options.mime ?? 'image/png';
  const quality = Math.min(1, Math.max(0.1, options.quality ?? 0.92));

  const img = await loadImageFromFile(file);
  try {
    const {width, height} = getLoadedSize(img);
    const swap = rotate === 90 || rotate === 270;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? height : width;
    canvas.height = swap ? width : height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    const scaleX = flip === 'horizontal' || flip === 'both' ? -1 : 1;
    const scaleY = flip === 'vertical' || flip === 'both' ? -1 : 1;
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);

    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, quality);
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}
