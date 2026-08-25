import {
  canvasToBlob,
  flattenOnWhite,
  getLoadedSize,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export type AspectPreset = 'free' | '1:1' | '16:9' | '4:3';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aspectRatioValue(preset: AspectPreset): number | null {
  switch (preset) {
    case '1:1':
      return 1;
    case '16:9':
      return 16 / 9;
    case '4:3':
      return 4 / 3;
    default:
      return null;
  }
}

export function clampCropRect(rect: CropRect, maxW: number, maxH: number): CropRect {
  const width = Math.max(1, Math.min(maxW, Math.round(rect.width)));
  const height = Math.max(1, Math.min(maxH, Math.round(rect.height)));
  const x = Math.max(0, Math.min(maxW - width, Math.round(rect.x)));
  const y = Math.max(0, Math.min(maxH - height, Math.round(rect.y)));
  return {x, y, width, height};
}

export function fitAspectCrop(rect: CropRect, aspect: number, maxW: number, maxH: number): CropRect {
  let {x, y, width, height} = rect;
  if (width / height > aspect) {
    width = Math.max(1, Math.round(height * aspect));
  } else {
    height = Math.max(1, Math.round(width / aspect));
  }
  return clampCropRect({x, y, width, height}, maxW, maxH);
}

export async function cropImage(
  file: File,
  rect: CropRect,
  mime: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    const size = getLoadedSize(img);
    const crop = clampCropRect(rect, size.width, size.height);
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}
