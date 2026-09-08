import type {PhotoTool} from './types';

export const TOOL_DEFS: {id: PhotoTool; tip: string; shortcut?: string}[] = [
  {id: 'move', tip: 'Move (V)', shortcut: 'V'},
  {id: 'select', tip: 'Rectangular Marquee (M)', shortcut: 'M'},
  {id: 'ellipse', tip: 'Elliptical Marquee (Shift+M)'},
  {id: 'lasso', tip: 'Lasso (L)', shortcut: 'L'},
  {id: 'wand', tip: 'Magic Wand (W)', shortcut: 'W'},
  {id: 'brush', tip: 'Brush (B)', shortcut: 'B'},
  {id: 'eraser', tip: 'Eraser (E)', shortcut: 'E'},
  {id: 'fill', tip: 'Paint Bucket (G)', shortcut: 'G'},
  {id: 'gradient', tip: 'Gradient (R)', shortcut: 'R'},
  {id: 'clone', tip: 'Clone Stamp (S) · Alt+click source', shortcut: 'S'},
  {id: 'eyedropper', tip: 'Eyedropper (I)', shortcut: 'I'},
  {id: 'text', tip: 'Text (T)', shortcut: 'T'},
  {id: 'crop', tip: 'Crop (C)', shortcut: 'C'},
  {id: 'shape', tip: 'Shape (U)', shortcut: 'U'},
  {id: 'transform', tip: 'Free Transform (Ctrl+T)'},
  {id: 'hand', tip: 'Hand (H / Space)', shortcut: 'H'},
  {id: 'zoom', tip: 'Zoom (Z) · Alt shrink', shortcut: 'Z'}
];
