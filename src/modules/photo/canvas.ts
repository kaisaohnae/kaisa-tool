export function createLayerCanvas(width: number, height: number, fill?: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  if (fill) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  return canvas;
}

export function createMaskCanvas(width: number, height: number, fill = '#ffffff') {
  return createLayerCanvas(width, height, fill);
}

export function cloneCanvas(source: HTMLCanvasElement) {
  const canvas = createLayerCanvas(source.width, source.height);
  canvas.getContext('2d')?.drawImage(source, 0, 0);
  return canvas;
}

export async function canvasFromImageFile(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = createLayerCanvas(bitmap.width, bitmap.height);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return canvas;
}

export function applyMaskToCanvas(source: HTMLCanvasElement, mask: HTMLCanvasElement) {
  const out = cloneCanvas(source);
  const maskCopy = cloneCanvas(mask);
  const maskCtx = maskCopy.getContext('2d', {willReadFrequently: true});
  const outCtx = out.getContext('2d');
  if (!maskCtx || !outCtx) return out;
  const image = maskCtx.getImageData(0, 0, maskCopy.width, maskCopy.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const lum = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
    image.data[i + 3] = lum;
  }
  maskCtx.putImageData(image, 0, 0);
  outCtx.globalCompositeOperation = 'destination-in';
  outCtx.drawImage(maskCopy, 0, 0);
  return out;
}

export function getOpaqueBounds(canvas: HTMLCanvasElement): {x: number; y: number; w: number; h: number} | null {
  const data = canvas.getContext('2d', {willReadFrequently: true})?.getImageData(0, 0, canvas.width, canvas.height).data;
  if (!data) return null;
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (data[(y * canvas.width + x) * 4 + 3] > 8) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? null : {x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1};
}

export function drawTransformedImage(
  ctx: CanvasRenderingContext2D, source: HTMLCanvasElement,
  x: number, y: number, w: number, h: number, rotationDeg: number
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotationDeg * Math.PI / 180);
  ctx.drawImage(source, -w / 2, -h / 2, w, h);
  ctx.restore();
}
