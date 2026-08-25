import {
  canvasToBlob,
  drawImageToCanvas,
  flattenOnWhite,
  getLoadedSize,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export async function compressImage(file: File, quality: number): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    const canvas = flattenOnWhite(drawImageToCanvas(img));
    return await canvasToBlob(canvas, 'image/jpeg', Math.min(0.95, Math.max(0.1, quality)));
  } finally {
    releaseLoadedImage(img);
  }
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  if (width < 1 || height < 1) throw new Error('가로·세로는 1 이상이어야 합니다.');
  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img, width, height);
    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, quality);
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}

export async function convertImage(file: File, mime: 'image/png' | 'image/jpeg', quality = 0.92): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img);
    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}

export async function getImageSize(file: File): Promise<{width: number; height: number}> {
  const img = await loadImageFromFile(file);
  try {
    return getLoadedSize(img);
  } finally {
    releaseLoadedImage(img);
  }
}

export function detectOutputMime(file: File): 'image/jpeg' | 'image/png' {
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) return 'image/png';
  return 'image/jpeg';
}
