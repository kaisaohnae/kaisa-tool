import {type Dispatch, type MutableRefObject, type SetStateAction, useCallback} from 'react';
import {
  createLayerCanvas,
  flipCanvas,
  rotateCanvas90,
  type PhotoLayer,
  type PhotoSelection
} from '@/modules/photo';

// Raster-canvas filter/transform helpers for the active layer: a generic filter-apply wrapper,
// flip, 90-degree rotate, and crop (which touches every layer's buffer/mask, not just the
// active one). Pulled out of PhotoEditor as a pure move (no behavior change).
export function usePhotoLayerFilters({
  activeLayer,
  activeLayerId,
  layers,
  width,
  height,
  cropDraft,
  buffersRef,
  masksRef,
  pushHistory,
  paint,
  setLayers,
  setWidth,
  setHeight,
  setCropDraft,
  setSelection,
  setStatus
}: {
  activeLayer: PhotoLayer | null;
  activeLayerId: string;
  layers: PhotoLayer[];
  width: number;
  height: number;
  cropDraft: PhotoSelection | null;
  buffersRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  masksRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  pushHistory: (label: string) => void;
  paint: () => void;
  setLayers: Dispatch<SetStateAction<PhotoLayer[]>>;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setCropDraft: Dispatch<SetStateAction<PhotoSelection | null>>;
  setSelection: Dispatch<SetStateAction<PhotoSelection | null>>;
  setStatus: (status: string) => void;
}) {
  const getActiveRasterCanvas = useCallback(() => {
    if (!activeLayer || activeLayer.kind !== 'raster') return null;
    return buffersRef.current.get(activeLayer.id) ?? null;
  }, [activeLayer]);

  const applyFilterToActiveLayer = useCallback(
    (label: string, fn: (canvas: HTMLCanvasElement) => void) => {
      const canvas = getActiveRasterCanvas();
      if (!canvas) {
        setStatus('Select a raster layer');
        return;
      }
      pushHistory(label);
      fn(canvas);
      paint();
      setStatus(label);
    },
    [getActiveRasterCanvas, pushHistory, paint]
  );

  const flipActiveLayer = useCallback((horizontal: boolean) => {
    const canvas = getActiveRasterCanvas();
    if (!canvas || !activeLayer) {
      setStatus('Select a raster layer');
      return;
    }
    const label = horizontal ? 'Flip Horizontal' : 'Flip Vertical';
    pushHistory(label);
    flipCanvas(canvas, horizontal);
    if (activeLayer.hasMask && activeLayer.maskLinked) {
      const mask = masksRef.current.get(activeLayer.id);
      if (mask) flipCanvas(mask, horizontal);
    }
    paint();
    setStatus(label);
  }, [activeLayer, getActiveRasterCanvas, paint, pushHistory]);

  const applyRotate90 = useCallback(
    (clockwise: boolean) => {
      const canvas = getActiveRasterCanvas();
      if (!canvas) {
        setStatus('Select a raster layer');
        return;
      }
      pushHistory(clockwise ? 'Rotate 90° CW' : 'Rotate 90° CCW');
      const rotated = rotateCanvas90(canvas, clockwise);
      if (layers.length === 1) {
        buffersRef.current.set(activeLayerId, rotated);
        if (activeLayer?.hasMask) {
          const mask = masksRef.current.get(activeLayerId);
          if (mask) masksRef.current.set(activeLayerId, rotateCanvas90(mask, clockwise));
        }
        setWidth(rotated.width);
        setHeight(rotated.height);
      } else {
        const next = createLayerCanvas(width, height);
        const ctx = next.getContext('2d');
        if (ctx) {
          const ox = Math.round((width - rotated.width) / 2);
          const oy = Math.round((height - rotated.height) / 2);
          ctx.drawImage(rotated, ox, oy);
        }
        buffersRef.current.set(activeLayerId, next);
      }
      paint();
      setStatus(clockwise ? 'Rotated 90° CW' : 'Rotated 90° CCW');
    },
    [getActiveRasterCanvas, pushHistory, paint, layers.length, activeLayerId, activeLayer, width, height]
  );

  const applyCrop = useCallback((area?: PhotoSelection) => {
    const cropArea = area ?? cropDraft;
    if (!cropArea || cropArea.w < 1 || cropArea.h < 1) {
      setStatus('Create a selection before cropping');
      return;
    }
    pushHistory('Crop');
    const x = Math.max(0, Math.floor(cropArea.x));
    const y = Math.max(0, Math.floor(cropArea.y));
    const right = Math.min(width, Math.ceil(cropArea.x + cropArea.w));
    const bottom = Math.min(height, Math.ceil(cropArea.y + cropArea.h));
    const w = Math.max(1, right - x);
    const h = Math.max(1, bottom - y);
    for (const layer of layers) {
      if (layer.kind !== 'raster') continue;
      const src = buffersRef.current.get(layer.id);
      if (src) {
        const next = createLayerCanvas(w, h);
        const ctx = next.getContext('2d');
        if (ctx) ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
        buffersRef.current.set(layer.id, next);
      }
      if (layer.hasMask) {
        const srcMask = masksRef.current.get(layer.id);
        if (srcMask) {
          const next = createLayerCanvas(w, h);
          const ctx = next.getContext('2d');
          if (ctx) ctx.drawImage(srcMask, x, y, w, h, 0, 0, w, h);
          masksRef.current.set(layer.id, next);
        }
      }
    }
    setLayers(prev => prev.map(layer =>
      layer.kind === 'text' && layer.text
        ? {...layer, text: {...layer.text, x: layer.text.x - x, y: layer.text.y - y}}
        : layer
    ));
    setWidth(w);
    setHeight(h);
    setCropDraft(null);
    setSelection(null);
    setStatus(`Cropped to ${w} × ${h}`);
  }, [cropDraft, pushHistory, layers, width, height]);

  return {getActiveRasterCanvas, applyFilterToActiveLayer, flipActiveLayer, applyRotate90, applyCrop};
}
