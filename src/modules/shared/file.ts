const MAX_CANVAS_EDGE = 8192;

export type LoadedImage = HTMLImageElement | ImageBitmap;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, '') || 'file';
  return `${base}.${ext}`;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Image conversion failed.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export function clampCanvasSize(width: number, height: number, maxEdge = MAX_CANVAS_EDGE): {width: number; height: number} {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return {width: w, height: h};
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale))
  };
}

export function getLoadedSize(img: LoadedImage): {width: number; height: number} {
  if ('naturalWidth' in img && img.naturalWidth) {
    return {width: img.naturalWidth, height: img.naturalHeight};
  }
  return {width: img.width, height: img.height};
}

export async function loadImageFromFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) {
    throw new Error('Not an image file.');
  }

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, {imageOrientation: 'from-image'} as ImageBitmapOptions);
    } catch {
      // fall through
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image.'));
    };
    img.src = url;
  });
}

export function releaseLoadedImage(img: LoadedImage) {
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    img.close();
  }
}

export function drawImageToCanvas(img: LoadedImage, width?: number, height?: number): HTMLCanvasElement {
  const source = getLoadedSize(img);
  const size = clampCanvasSize(width ?? source.width, height ?? source.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function flattenOnWhite(source: HTMLCanvasElement): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = source.width;
  tmp.height = source.height;
  const ctx = tmp.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(source, 0, 0);
  return tmp;
}

export function matchesAccept(file: File, accept: string): boolean {
  if (!accept || accept === '*' || accept === '*/*') return true;
  const tokens = accept.split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  return tokens.some(token => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token || name.endsWith(`.${token.split('/').pop()}`);
  });
}

export function filterAcceptedFiles(files: FileList | File[], accept: string): File[] {
  return Array.from(files).filter(file => matchesAccept(file, accept));
}

export function normalizePastedFile(file: File): File {
  if (file.name) return file;
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/').pop() || 'png';
  return new File([file], `pasted-image.${ext}`, {type: file.type, lastModified: Date.now()});
}

export function filesFromClipboard(clipboardData: DataTransfer | null, accept: string): File[] {
  if (!clipboardData) return [];
  const files: File[] = [];

  for (const item of Array.from(clipboardData.items)) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) files.push(normalizePastedFile(file));
  }

  if (!files.length && clipboardData.files.length) {
    for (const file of Array.from(clipboardData.files)) {
      files.push(normalizePastedFile(file));
    }
  }

  return filterAcceptedFiles(files, accept);
}

export async function fileToJpegBytes(file: File, quality = 0.92): Promise<Uint8Array> {
  const img = await loadImageFromFile(file);
  try {
    const canvas = flattenOnWhite(drawImageToCanvas(img));
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    releaseLoadedImage(img);
  }
}
