import {cloneCanvas, createLayerCanvas} from './canvas';
import type {CompositeLayerInput} from './composite';
import {DEFAULT_ADJUSTMENT, type AdjustmentType, type PhotoLayer, type TextLayerData} from './types';

let layerSequence = 1;
let documentSequence = 1;

export function nextLayerId() {
  return `layer-${++layerSequence}`;
}

export function nextDocName() {
  return `Untitled-${documentSequence++}`;
}

export function createRasterLayer(name: string, partial: Partial<PhotoLayer> = {}): PhotoLayer {
  return {
    id: nextLayerId(), name, visible: true, opacity: 1, locked: false, kind: 'raster',
    hasMask: false, maskLinked: true, blendMode: 'source-over', ...partial
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
    mask: layer.hasMask ? masks.get(layer.id) ?? null : null
  }));
}

export function reorderLayer(layers: PhotoLayer[], id: string, direction: 'up' | 'down') {
  const index = layers.findIndex(layer => layer.id === id);
  const target = direction === 'up' ? index + 1 : index - 1;
  if (index < 0 || target < 0 || target >= layers.length) return layers;
  const next = [...layers]; [next[index], next[target]] = [next[target], next[index]]; return next;
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
    adjustmentParams: source.adjustmentParams ? {...source.adjustmentParams} : undefined
  };
  const buffer = buffers.get(id); if (buffer) buffers.set(layer.id, cloneCanvas(buffer));
  const mask = masks.get(id); if (mask) masks.set(layer.id, cloneCanvas(mask));
  const index = layers.indexOf(source), next = [...layers]; next.splice(index + 1, 0, layer);
  return {layers: next, layer};
}
