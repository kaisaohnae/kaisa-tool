export type RetouchMode = 'blurTool' | 'sharpenTool' | 'dodge' | 'burn';

export type RetouchBrush = {
  size: number;
  hardness: number;
  strength: number;
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
  const padding = mode === 'blurTool' || mode === 'sharpenTool' ? 2 : 0;
  const left = Math.max(0, Math.floor(centerX - radius) - padding);
  const top = Math.max(0, Math.floor(centerY - radius) - padding);
  const right = Math.min(canvas.width, Math.ceil(centerX + radius) + padding);
  const bottom = Math.min(canvas.height, Math.ceil(centerY + radius) + padding);
  if (right <= left || bottom <= top) return;
  const image = ctx.getImageData(left, top, right - left, bottom - top);
  const source = new Uint8ClampedArray(image.data);
  const inner = radius * Math.max(0, Math.min(100, brush.hardness)) / 100;
  const amount = Math.max(0.01, Math.min(1, brush.strength / 100));
  const width = image.width;
  const height = image.height;

  for (let py = padding; py < height - padding; py++) {
    for (let px = padding; px < width - padding; px++) {
      const gx = left + px + 0.5;
      const gy = top + py + 0.5;
      const distance = Math.hypot(gx - centerX, gy - centerY);
      if (distance > radius) continue;
      const feather = inner >= radius || distance <= inner ? 1 : 1 - (distance - inner) / (radius - inner);
      const mix = amount * feather;
      const index = (py * width + px) * 4;
      let average = [0, 0, 0];
      if (mode === 'blurTool' || mode === 'sharpenTool') {
        let count = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const sample = ((py + oy) * width + px + ox) * 4;
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
