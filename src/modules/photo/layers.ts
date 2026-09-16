import {cloneCanvas, createLayerCanvas} from './canvas';
import type {CompositeLayerInput} from './composite';
import {drawTextLayer} from './text';
import {
  DEFAULT_ADJUSTMENT,
  DEFAULT_LAYER_STYLE,
  type AdjustmentType,
  type LayerStyle,
  type PhotoLayer,
  type TextLayerData
} from './types';

let layerSequence = 1;
let documentSequence = 1;

export function nextLayerId() {
  return `layer-${crypto.randomUUID()}`;
}

export function syncLayerSequence(layers: PhotoLayer[]) {
  const maximum = layers.reduce((max, layer) => {
    const match = /^layer-(\d+)$/.exec(layer.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, layerSequence);
  layerSequence = maximum;
}

export function nextDocName() {
  return `Untitled-${documentSequence++}`;
}

export function nextDocId() {
  return `doc-${crypto.randomUUID()}`;
}

export function cloneLayerStyle(style: LayerStyle = DEFAULT_LAYER_STYLE): LayerStyle {
  return {
    dropShadow: {...style.dropShadow},
    border: {...style.border},
    overlay: {...style.overlay}
  };
}

export function createRasterLayer(name: string, partial: Partial<PhotoLayer> = {}): PhotoLayer {
  return {
    id: nextLayerId(), name, visible: true, opacity: 1, locked: false, kind: 'raster',
    hasMask: false, maskLinked: true, blendMode: 'source-over', style: cloneLayerStyle(), ...partial
  };
}

export function createAdjustmentLayer(type: AdjustmentType, name?: string): PhotoLayer {
  const names: Record<AdjustmentType, string> = {
    brightnessContrast: 'Brightness/Contrast', hueSaturation: 'Hue/Saturation', levels: 'Levels'
  };
  return {
    id: nextLayerId(), name: name ?? names[type], visible: true, opacity: 1, locked: false,
    kind: 'adjustment', hasMask: false, maskLinked: true, blendMode: 'source-over',
    adjustment: type, adjustmentParams: {...DEFAULT_ADJUSTMENT}
  };
}

export function createTextLayer(
  x: number,
  y: number,
  color: string,
  partial: Partial<TextLayerData> = {}
): PhotoLayer {
  return {
    id: nextLayerId(),
    name: 'Text',
    visible: true,
    opacity: 1,
    locked: false,
    kind: 'text',
    hasMask: false,
    maskLinked: true,
    blendMode: 'source-over',
    style: cloneLayerStyle(),
    text: {
      content: '',
      x,
      y,
      fontSize: 32,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      color,
      align: 'left',
      lineHeight: 1.2,
      tracking: 0,
      underline: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      ...partial
    }
  };
}

export function toCompositeInputs(
  layers: PhotoLayer[], buffers: Map<string, HTMLCanvasElement>, masks: Map<string, HTMLCanvasElement>,
  width: number, height: number
): CompositeLayerInput[] {
  return layers.map(layer => ({
    canvas: layer.kind === 'raster' ? buffers.get(layer.id) ?? createLayerCanvas(width, height) : undefined,
    visible: layer.visible, opacity: layer.opacity, kind: layer.kind, blendMode: layer.blendMode,
    adjustment: layer.adjustment, adjustmentParams: layer.adjustmentParams,
    text: layer.text,
    style: layer.style,
    mask: layer.hasMask ? masks.get(layer.id) ?? null : null
  }));
}

export function reorderLayer(layers: PhotoLayer[], id: string, direction: 'up' | 'down') {
  const index = layers.findIndex(layer => layer.id === id);
  const target = direction === 'up' ? index + 1 : index - 1;
  if (index < 0 || target < 0 || target >= layers.length) return layers;
  const next = [...layers]; [next[index], next[target]] = [next[target], next[index]]; return next;
}

export function moveLayerToEdge(layers: PhotoLayer[], id: string, edge: 'front' | 'back') {
  const layer = layers.find(item => item.id === id);
  if (!layer) return layers;
  const next = layers.filter(item => item.id !== id);
  edge === 'front' ? next.push(layer) : next.unshift(layer);
  return next;
}

// Drags `draggedId` to sit where `targetId` currently is (used by drag-and-drop reordering
// in the layers panel). No-op if either id is missing or they're the same layer.
export function moveLayerBeside(layers: PhotoLayer[], draggedId: string, targetId: string) {
  if (draggedId === targetId) return layers;
  const from = layers.findIndex(item => item.id === draggedId);
  const to = layers.findIndex(item => item.id === targetId);
  if (from < 0 || to < 0) return layers;
  const next = [...layers];
  const [moved] = next.splice(from, 1);
  next.splice(next.findIndex(item => item.id === targetId), 0, moved);
  return next;
}

export function toggleLayerLock(layers: PhotoLayer[], id: string) {
  return layers.map(layer => layer.id === id ? {...layer, locked: !layer.locked} : layer);
}

export function rasterizeTextLayer(
  layers: PhotoLayer[],
  layerId: string,
  buffers: Map<string, HTMLCanvasElement>,
  width: number,
  height: number
) {
  const source = layers.find(layer => layer.id === layerId);
  if (!source?.text || source.kind !== 'text') return null;
  const canvas = createLayerCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawTextLayer(ctx, source.text);
  buffers.set(layerId, canvas);
  const layer: PhotoLayer = {...source, kind: 'raster', text: undefined};
  return {layer, layers: layers.map(item => item.id === layerId ? layer : item)};
}

export function translateRasterCanvas(source: HTMLCanvasElement, dx: number, dy: number) {
  const next = createLayerCanvas(source.width, source.height);
  next.getContext('2d')?.drawImage(source, dx, dy);
  return next;
}

export function duplicateLayerState(
  layers: PhotoLayer[], id: string, buffers: Map<string, HTMLCanvasElement>, masks: Map<string, HTMLCanvasElement>
) {
  const source = layers.find(layer => layer.id === id);
  if (!source) return null;
  const layer = {
    ...source,
    id: nextLayerId(),
    name: `${source.name} copy`,
    locked: false,
    text: source.text ? {...source.text} : undefined,
    adjustmentParams: source.adjustmentParams ? {...source.adjustmentParams} : undefined,
    style: source.style ? cloneLayerStyle(source.style) : undefined
  };
  const buffer = buffers.get(id); if (buffer) buffers.set(layer.id, cloneCanvas(buffer));
  const mask = masks.get(id); if (mask) masks.set(layer.id, cloneCanvas(mask));
  const index = layers.indexOf(source), next = [...layers]; next.splice(index + 1, 0, layer);
  return {layers: next, layer};
}
