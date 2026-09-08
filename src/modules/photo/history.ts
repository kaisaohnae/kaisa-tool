import {createLayerCanvas} from './canvas';
import type {PhotoLayer} from './types';

export type HistorySnapshot = {
  width: number;
  height: number;
  activeLayerId: string;
  label: string;
  layers: (PhotoLayer & {data: ImageData | null; maskData: ImageData | null})[];
};

type SnapshotLayer = PhotoLayer & {canvas: HTMLCanvasElement | null; mask: HTMLCanvasElement | null};

export function snapshotDocument(width: number, height: number, layers: SnapshotLayer[], activeLayerId: string, label = 'Edit'): HistorySnapshot {
  return {
    width, height, activeLayerId, label,
    layers: layers.map(({canvas, mask, ...layer}) => ({
      ...layer,
      adjustmentParams: layer.adjustmentParams ? {...layer.adjustmentParams} : undefined,
      text: layer.text ? {...layer.text} : undefined,
      data: canvas?.getContext('2d', {willReadFrequently: true})?.getImageData(0, 0, canvas.width, canvas.height) ?? null,
      maskData: mask?.getContext('2d', {willReadFrequently: true})?.getImageData(0, 0, mask.width, mask.height) ?? null
    }))
  };
}

export function restoreSnapshot(snap: HistorySnapshot, buffers: Map<string, HTMLCanvasElement>, masks: Map<string, HTMLCanvasElement>) {
  buffers.clear(); masks.clear();
  for (const {data, maskData, id} of snap.layers) {
    if (data) { const canvas = createLayerCanvas(snap.width, snap.height); canvas.getContext('2d')?.putImageData(data, 0, 0); buffers.set(id, canvas); }
    if (maskData) { const mask = createLayerCanvas(snap.width, snap.height); mask.getContext('2d')?.putImageData(maskData, 0, 0); masks.set(id, mask); }
  }
  return {
    activeLayerId: snap.activeLayerId,
    layers: snap.layers.map(({data: _data, maskData: _maskData, ...layer}) => ({
      ...layer,
      adjustmentParams: layer.adjustmentParams ? {...layer.adjustmentParams} : undefined,
      text: layer.text ? {...layer.text} : undefined
    }))
  };
}
