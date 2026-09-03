import {
  canvasToBlob,
  drawImageToCanvas,
  flattenOnWhite,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export type TextFontWeight = 'bold' | 'normal' | 'none';

export interface TextFontFamilyOption {
  value: string;
  label: string;
}

export const TEXT_FONT_FAMILIES: TextFontFamilyOption[] = [
  {value: 'sans-serif', label: 'Sans-serif'},
  {value: 'serif', label: 'Serif'},
  {value: 'monospace', label: 'Monospace'},
  {value: 'Arial, sans-serif', label: 'Arial'},
  {value: 'Georgia, serif', label: 'Georgia'},
  {value: '"Malgun Gothic", sans-serif', label: 'Malgun Gothic'},
  {value: '"Apple SD Gothic Neo", sans-serif', label: 'Apple SD Gothic Neo'}
];

export const DEFAULT_TEXT_FONT_FAMILY = 'sans-serif';
export const DEFAULT_TEXT_FONT_WEIGHT: TextFontWeight = 'bold';
export const TEXT_OUTLINE_WIDTH = 2;
export const TEXT_OUTLINE_COLOR = '#ffffff';

export interface TextLayer {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: TextFontWeight;
  color: string;
  outlineWidth: number;
  outlineColor: string;
}

export function textFontWeightCss(weight: TextFontWeight): string | number {
  switch (weight) {
    case 'bold':
      return 'bold';
    case 'none':
      return 300;
    default:
      return 'normal';
  }
}

export function buildCanvasFont(layer: Pick<TextLayer, 'fontWeight' | 'fontSize' | 'fontFamily'>): string {
  const fontSize = Math.max(8, Math.min(512, Math.round(layer.fontSize)));
  const weight = textFontWeightCss(layer.fontWeight ?? DEFAULT_TEXT_FONT_WEIGHT);
  const family = layer.fontFamily || DEFAULT_TEXT_FONT_FAMILY;
  return `${weight} ${fontSize}px ${family}`;
}

export function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  const content = layer.content.trim();
  if (!content) return;

  const outlineWidth = Math.max(0, Math.min(24, Math.round(layer.outlineWidth ?? TEXT_OUTLINE_WIDTH)));

  ctx.font = buildCanvasFont(layer);
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  if (outlineWidth > 0) {
    ctx.strokeStyle = layer.outlineColor || TEXT_OUTLINE_COLOR;
    ctx.lineWidth = outlineWidth;
    ctx.strokeText(content, layer.x, layer.y);
  }

  ctx.fillStyle = layer.color || '#ff0000';
  ctx.fillText(content, layer.x, layer.y);
}

export async function applyTextLayers(
  file: File,
  layers: TextLayer[],
  mime: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
): Promise<Blob> {
  const img = await loadImageFromFile(file);
  try {
    const canvas = drawImageToCanvas(img);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');

    for (const layer of layers) {
      drawTextLayer(ctx, layer);
    }

    if (mime === 'image/jpeg') {
      return await canvasToBlob(flattenOnWhite(canvas), mime, Math.min(1, Math.max(0.1, quality)));
    }
    return await canvasToBlob(canvas, mime);
  } finally {
    releaseLoadedImage(img);
  }
}
