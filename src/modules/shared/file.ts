export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('이미지 변환에 실패했습니다.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러오지 못했습니다.'));
    };
    img.src = url;
  });
}

export function drawImageToCanvas(img: HTMLImageElement, width?: number, height?: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width ?? img.naturalWidth));
  canvas.height = Math.max(1, Math.round(height ?? img.naturalHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas를 사용할 수 없습니다.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
