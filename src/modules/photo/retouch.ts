export type RetouchMode = 'blurTool' | 'sharpenTool' | 'dodge' | 'burn';

export type RetouchBrush = {
  size: number;
  hardness: number;
  strength: number;
  mask?: HTMLCanvasElement | null;
};

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function applyRetouchStamp(
  canvas: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  mode: RetouchMode,
  brush: RetouchBrush
) {
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  if (!ctx) return;
  const radius = Math.max(1, brush.size / 2);
  const kernelRadius = mode === 'blurTool' ? Math.max(1, Math.min(8, Math.ceil(brush.size / 20))) : 1;
  const padding = mode === 'blurTool' || mode === 'sharpenTool' ? kernelRadius : 0;
  const left = Math.max(0, Math.floor(centerX - radius) - padding);
  const top = Math.max(0, Math.floor(centerY - radius) - padding);
  const right = Math.min(canvas.width, Math.ceil(centerX + radius) + padding);
  const bottom = Math.min(canvas.height, Math.ceil(centerY + radius) + padding);
  if (right <= left || bottom <= top) return;
  const image = ctx.getImageData(left, top, right - left, bottom - top);
  const source = new Uint8ClampedArray(image.data);
  const inner = radius * Math.max(0, Math.min(100, brush.hardness)) / 100;
  const amount = Math.max(0, Math.min(1, brush.strength / 100));
  const width = image.width;
  const height = image.height;

  const maskData = brush.mask?.getContext('2d')?.getImageData(left, top, width, height).data;
  // Summed-area tables keep a wider blur kernel fast and ignore hidden RGB in transparent pixels.
  const stride = width + 1;
  const sums = mode === 'blurTool' ? Array.from({length: 4}, () => new Float64Array(stride * (height + 1))) : null;
  if (sums) for (let y = 0; y < height; y++) {
    const row = [0, 0, 0, 0];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = source[i + 3] / 255;
      for (let c = 0; c < 4; c++) {
        row[c] += c === 3 ? alpha : source[i + c] * alpha;
        sums[c][(y + 1) * stride + x + 1] = sums[c][y * stride + x + 1] + row[c];
      }
    }
  }
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const gx = left + px + 0.5;
      const gy = top + py + 0.5;
      const distance = Math.hypot(gx - centerX, gy - centerY);
      if (distance > radius) continue;
      const feather = inner >= radius || distance <= inner ? 1 : 1 - (distance - inner) / (radius - inner);
      const index = (py * width + px) * 4;
      const mix = amount * feather * (maskData ? maskData[index + 3] / 255 : 1);
      if (mix === 0 || source[index + 3] === 0) continue;
      let average = [0, 0, 0];
      if (sums) {
        const x1 = Math.max(0, px - kernelRadius), y1 = Math.max(0, py - kernelRadius);
        const x2 = Math.min(width, px + kernelRadius + 1), y2 = Math.min(height, py + kernelRadius + 1);
        const total = (channel: number) => sums[channel][y2 * stride + x2] - sums[channel][y1 * stride + x2]
          - sums[channel][y2 * stride + x1] + sums[channel][y1 * stride + x1];
        const alpha = total(3);
        average = alpha > 0 ? [total(0) / alpha, total(1) / alpha, total(2) / alpha] : [source[index], source[index + 1], source[index + 2]];
      } else if (mode === 'sharpenTool') {
        let count = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const sample = (Math.max(0, Math.min(height - 1, py + oy)) * width + Math.max(0, Math.min(width - 1, px + ox))) * 4;
          average[0] += source[sample];
          average[1] += source[sample + 1];
          average[2] += source[sample + 2];
          count++;
        }
        average = average.map(value => value / count);
      }
      for (let channel = 0; channel < 3; channel++) {
        const current = source[index + channel];
        let target = current;
        if (mode === 'dodge') target = 255;
        else if (mode === 'burn') target = 0;
        else if (mode === 'blurTool') target = average[channel];
        else target = current + (current - average[channel]) * 1.5;
        image.data[index + channel] = clampByte(current + (target - current) * mix);
      }
    }
  }
  ctx.putImageData(image, left, top);
}

export function applyRetouchStroke(
  canvas: HTMLCanvasElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  mode: RetouchMode,
  brush: RetouchBrush
) {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const spacing = Math.max(1, brush.size * 0.18);
  const stamps = Math.max(1, Math.ceil(distance / spacing));
  for (let index = 1; index <= stamps; index++) {
    const t = index / stamps;
    applyRetouchStamp(canvas, fromX + (toX - fromX) * t, fromY + (toY - fromY) * t, mode, brush);
  }
}
