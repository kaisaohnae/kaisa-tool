import {cloneCanvas} from './canvas';
import {hslToRgb, rgbToHsl} from './color';
import type {AdjustmentParams, AdjustmentType} from './types';

function adjusted(source: HTMLCanvasElement, transform: (data: Uint8ClampedArray) => void) {
  const out = cloneCanvas(source), ctx = out.getContext('2d', {willReadFrequently: true}); if (!ctx) return out;
  const image = ctx.getImageData(0, 0, out.width, out.height); transform(image.data); ctx.putImageData(image, 0, 0); return out;
}

export function applyBrightnessContrast(source: HTMLCanvasElement, params: AdjustmentParams) {
  const brightness = Math.max(-150, Math.min(150, params.brightness)) / 150;
  const contrast = Math.max(-100, Math.min(100, params.contrast)) / 100;
  const factor = (1 + contrast) / (1.0001 - contrast);
  return adjusted(source, data => { for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) {
    data[i + c] = Math.max(0, Math.min(255, (factor * (data[i + c] / 255 + brightness - .5) + .5) * 255));
  }});
}

export function applyHueSaturation(source: HTMLCanvasElement, params: AdjustmentParams) {
  return adjusted(source, data => { for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    let [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    h = (h + params.hue + 360) % 360; s = Math.max(0, Math.min(1, s * (1 + params.saturation / 100)));
    l = Math.max(0, Math.min(1, l + params.lightness / 100));
    [data[i], data[i + 1], data[i + 2]] = hslToRgb(h, s, l);
  }});
}

export function applyLevels(source: HTMLCanvasElement, params: AdjustmentParams) {
  const black = Math.max(0, Math.min(254, params.black ?? 0));
  const white = Math.max(black + 1, Math.min(255, params.white ?? 255));
  const gamma = Math.max(.1, Math.min(3, params.gamma ?? 1));
  return adjusted(source, data => { for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) {
    const normalized = Math.max(0, Math.min(1, (data[i + c] - black) / (white - black)));
    data[i + c] = Math.pow(normalized, 1 / gamma) * 255;
  }});
}

export function applyAdjustment(source: HTMLCanvasElement, type: AdjustmentType | undefined, params: AdjustmentParams) {
  if (type === 'hueSaturation') return applyHueSaturation(source, params);
  if (type === 'levels') return applyLevels(source, params);
  return applyBrightnessContrast(source, params);
}
