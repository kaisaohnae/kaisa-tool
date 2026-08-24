import {canvasToBlob, drawImageToCanvas, loadImageFromFile} from '@/modules/shared/file';

export async function compressImage(file: File, quality: number): Promise<Blob> {
  const img = await loadImageFromFile(file);
  const canvas = drawImageToCanvas(img);
  // PNG도 JPEG로 재인코딩해 용량을 줄입니다.
  return canvasToBlob(canvas, 'image/jpeg', Math.min(1, Math.max(0.05, quality)));
}

export async function resizeImage(file: File, width: number, height: number, mime: 'image/jpeg' | 'image/png' = 'image/jpeg', quality = 0.92): Promise<Blob> {
  const img = await loadImageFromFile(file);
  const canvas = drawImageToCanvas(img, width, height);
  if (mime === 'image/jpeg') {
    const flat = flattenOnWhite(canvas);
    return canvasToBlob(flat, mime, quality);
  }
  return canvasToBlob(canvas, mime);
}

export async function convertImage(file: File, mime: 'image/png' | 'image/jpeg', quality = 0.92): Promise<Blob> {
  const img = await loadImageFromFile(file);
  const canvas = drawImageToCanvas(img);
  if (mime === 'image/jpeg') {
    return canvasToBlob(flattenOnWhite(canvas), mime, quality);
  }
  return canvasToBlob(canvas, mime);
}

function flattenOnWhite(source: HTMLCanvasElement): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = source.width;
  tmp.height = source.height;
  const ctx = tmp.getContext('2d');
  if (!ctx) throw new Error('Canvas를 사용할 수 없습니다.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(source, 0, 0);
  return tmp;
}

export async function getImageSize(file: File): Promise<{width: number; height: number}> {
  const img = await loadImageFromFile(file);
  return {width: img.naturalWidth, height: img.naturalHeight};
}
