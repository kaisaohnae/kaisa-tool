import JSZip from 'jszip';
import {
  canvasToBlob,
  getLoadedSize,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;

export type FaviconFit = 'cover' | 'contain';

function drawSquare(img: ImageBitmap | HTMLImageElement, size: number, fit: FaviconFit): HTMLCanvasElement {
  const {width: sw, height: sh} = getLoadedSize(img);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');

  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (fit === 'cover') {
    const scale = Math.max(size / sw, size / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  } else {
    const scale = Math.min(size / sw, size / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  }
  return canvas;
}

export async function generateFaviconPng(file: File, size: number, fit: FaviconFit = 'cover'): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    return await canvasToBlob(drawSquare(img, size, fit), 'image/png');
  } finally {
    releaseLoadedImage(img);
  }
}

export async function generateFaviconZip(file: File, fit: FaviconFit = 'cover'): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    const zip = new JSZip();
    for (const size of FAVICON_SIZES) {
      const blob = await canvasToBlob(drawSquare(img, size, fit), 'image/png');
      zip.file(`favicon-${size}x${size}.png`, blob);
    }
    return zip.generateAsync({type: 'blob', compression: 'DEFLATE'});
  } finally {
    releaseLoadedImage(img);
  }
}
