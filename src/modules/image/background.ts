import {
  canvasToBlob,
  drawImageToCanvas,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

function parseHexColor(hex: string): {r: number; g: number; b: number} {
  const raw = hex.trim().replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error('Enter a valid color code.');
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

export async function flattenOntoColor(
  file: File,
  color: string,
  mime: 'image/png' | 'image/jpeg' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  const {r, g, b} = parseHexColor(color);
  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img);
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const ctx = flat.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    if (mime === 'image/jpeg') {
      return await canvasToBlob(flat, mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(flat, mime);
  } finally {
    releaseLoadedImage(img);
  }
}

export async function removeNearColor(
  file: File,
  color: string,
  tolerance: number
): Promise<Blob> {
  const target = parseHexColor(color);
  const tol = Math.min(255, Math.max(0, Math.round(tolerance)));
  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const dr = Math.abs(data[i] - target.r);
      const dg = Math.abs(data[i + 1] - target.g);
      const db = Math.abs(data[i + 2] - target.b);
      if (dr <= tol && dg <= tol && db <= tol) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return await canvasToBlob(canvas, 'image/png');
  } finally {
    releaseLoadedImage(img);
  }
}
