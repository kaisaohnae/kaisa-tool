export type PhotoTool =
  | 'move'
  | 'select'
  | 'ellipse'
  | 'lasso'
  | 'wand'
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'gradient'
  | 'clone'
  | 'eyedropper'
  | 'text'
  | 'crop'
  | 'shape'
  | 'hand'
  | 'zoom'
  | 'transform';

export type LayerKind = 'raster' | 'adjustment' | 'text';

export interface TextLayerData {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export type AdjustmentType = 'brightnessContrast' | 'hueSaturation' | 'levels';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface AdjustmentParams {
  brightness: number;
  contrast: number;
  hue: number;
  saturation: number;
  lightness: number;
  black?: number;
  white?: number;
  gamma?: number;
}

export interface PhotoLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  kind: LayerKind;
  hasMask: boolean;
  maskLinked: boolean;
  blendMode: BlendMode;
  adjustment?: AdjustmentType;
  adjustmentParams?: AdjustmentParams;
  text?: TextLayerData;
}

export type SelectionShape = 'rect' | 'ellipse' | 'lasso';

export type ShapeMode = 'rect' | 'ellipse' | 'rounded';
export type ShapeStyle = 'fill' | 'stroke' | 'both';

export interface PhotoSelection {
  shape: SelectionShape;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: {x: number; y: number}[];
}

export interface TransformState {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  layerId: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  target: 'canvas' | 'layer';
  layerId?: string;
}

export const TOOL_SHORTCUTS: Record<string, PhotoTool> = {
  v: 'move',
  m: 'select',
  l: 'lasso',
  w: 'wand',
  b: 'brush',
  e: 'eraser',
  g: 'fill',
  r: 'gradient',
  s: 'clone',
  i: 'eyedropper',
  t: 'text',
  c: 'crop',
  u: 'shape',
  h: 'hand',
  z: 'zoom'
};

export const BLEND_MODES: {value: BlendMode; label: string}[] = [
  {value: 'source-over', label: 'Normal'},
  {value: 'multiply', label: 'Multiply'},
  {value: 'screen', label: 'Screen'},
  {value: 'overlay', label: 'Overlay'},
  {value: 'darken', label: 'Darken'},
  {value: 'lighten', label: 'Lighten'},
  {value: 'color-dodge', label: 'Color Dodge'},
  {value: 'color-burn', label: 'Color Burn'},
  {value: 'hard-light', label: 'Hard Light'},
  {value: 'soft-light', label: 'Soft Light'},
  {value: 'difference', label: 'Difference'},
  {value: 'exclusion', label: 'Exclusion'}
];

export const DEFAULT_FG = '#000000';
export const DEFAULT_BG = '#ffffff';
export const DEFAULT_ADJUSTMENT: AdjustmentParams = {
  brightness: 0,
  contrast: 0,
  hue: 0,
  saturation: 0,
  lightness: 0,
  black: 0,
  white: 255,
  gamma: 1
};
