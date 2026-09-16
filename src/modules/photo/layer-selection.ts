import type {PhotoLayer} from './types';

export function layerSelectionRange(layers: Pick<PhotoLayer, 'id'>[], anchor: string, target: string) {
  const a = layers.findIndex(layer => layer.id === anchor), b = layers.findIndex(layer => layer.id === target);
  if (b < 0) return [];
  if (a < 0) return [target];
  return layers.slice(Math.min(a,b), Math.max(a,b)+1).map(layer => layer.id);
}

export function replaceMergedLayers(layers: PhotoLayer[], selectedIds: string[], merged: PhotoLayer) {
  const selected = new Set(selectedIds);
  const top = [...layers].reverse().find(layer => selected.has(layer.id));
  if (!top) return layers;
  return layers.flatMap(layer => layer.id === top.id ? [merged] : selected.has(layer.id) ? [] : [layer]);
}