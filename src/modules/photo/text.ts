import type {TextLayerData} from './types';

export type TextBounds = {x: number; y: number; w: number; h: number};

function textFont(text: TextLayerData) {
  return `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
}

export function getTextLayerBounds(
  text: TextLayerData,
  context?: CanvasRenderingContext2D
): TextBounds {
  const canvas = !context && typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ctx = context ?? canvas?.getContext('2d');
  const lines = text.content.split('\n');
  const fallbackWidth = Math.max(1, ...lines.map(line => line.length * text.fontSize * 0.6));
  let width = fallbackWidth;
  if (ctx) {
    ctx.save();
    ctx.font = textFont(text);
    width = Math.max(1, ...lines.map(line => ctx.measureText(line || ' ').width));
    ctx.restore();
  }
  const x = text.align === 'center' ? text.x - width / 2 : text.align === 'right' ? text.x - width : text.x;
  return {x, y: text.y, w: width, h: Math.max(text.fontSize, lines.length * text.fontSize * text.lineHeight)};
}

export function drawTextLayer(ctx: CanvasRenderingContext2D, text: TextLayerData) {
  ctx.save();
  ctx.font = textFont(text);
  ctx.fillStyle = text.color;
  ctx.textAlign = text.align;
  ctx.textBaseline = 'top';
  const step = text.fontSize * text.lineHeight;
  text.content.split('\n').forEach((line, index) => ctx.fillText(line, text.x, text.y + index * step));
  ctx.restore();
}

export function renderTextLayer(canvas: HTMLCanvasElement, text: TextLayerData) {
  const ctx = canvas.getContext('2d');
  if (ctx) drawTextLayer(ctx, text);
  return canvas;
}
