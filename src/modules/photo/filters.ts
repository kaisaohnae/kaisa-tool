import {createLayerCanvas} from './canvas';

function mutatePixels(source: HTMLCanvasElement, fn: (data: Uint8ClampedArray, width: number, height: number) => void) {
  const ctx = source.getContext('2d', {willReadFrequently: true}); if (!ctx) return;
  const image = ctx.getImageData(0, 0, source.width, source.height);
  fn(image.data, source.width, source.height); ctx.putImageData(image, 0, 0);
}

export function invertCanvas(source: HTMLCanvasElement) {
  mutatePixels(source, data => { for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; data[i + 1] = 255 - data[i + 1]; data[i + 2] = 255 - data[i + 2];
  }});
}

export function desaturateCanvas(source: HTMLCanvasElement) {
  mutatePixels(source, data => { for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }});
}

export function flipCanvas(source: HTMLCanvasElement, horizontal: boolean) {
  const copy = createLayerCanvas(source.width, source.height), ctx = copy.getContext('2d'); if (!ctx) return;
  ctx.translate(horizontal ? source.width : 0, horizontal ? 0 : source.height);
  ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1); ctx.drawImage(source, 0, 0);
  const dest = source.getContext('2d'); dest?.clearRect(0, 0, source.width, source.height); dest?.drawImage(copy, 0, 0);
}

export function rotateCanvas90(source: HTMLCanvasElement, clockwise: boolean) {
  const out = createLayerCanvas(source.height, source.width), ctx = out.getContext('2d'); if (!ctx) return source;
  ctx.translate(clockwise ? out.width : 0, clockwise ? 0 : out.height);
  ctx.rotate(clockwise ? Math.PI / 2 : -Math.PI / 2); ctx.drawImage(source, 0, 0); return out;
}

export function boxBlurCanvas(source: HTMLCanvasElement, radius = 2) {
  const ctx = source.getContext('2d'); if (!ctx) return;
  const copy = createLayerCanvas(source.width, source.height), copyCtx = copy.getContext('2d'); if (!copyCtx) return;
  copyCtx.filter = `blur(${Math.max(1, Math.min(20, radius))}px)`; copyCtx.drawImage(source, 0, 0);
  ctx.clearRect(0, 0, source.width, source.height); ctx.drawImage(copy, 0, 0);
}

export function sharpenCanvas(source: HTMLCanvasElement, amount = .5) {
  const ctx = source.getContext('2d', {willReadFrequently: true}); if (!ctx) return;
  const image = ctx.getImageData(0, 0, source.width, source.height), original = new Uint8ClampedArray(image.data);
  const a = Math.max(0, Math.min(2, amount)), kernel = [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0];
  for (let y = 1; y < source.height - 1; y++) for (let x = 1; x < source.width - 1; x++) for (let c = 0; c < 3; c++) {
    let sum = 0, k = 0;
    for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) sum += original[((y + ky) * source.width + x + kx) * 4 + c] * kernel[k++];
    image.data[(y * source.width + x) * 4 + c] = sum;
  }
  ctx.putImageData(image, 0, 0);
}
