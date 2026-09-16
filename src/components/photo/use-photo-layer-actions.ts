import {type Dispatch, type MutableRefObject, type SetStateAction, useCallback} from 'react';
import {
  applyMaskToCanvas,
  cloneLayerStyle,
  createAdjustmentLayer,
  createLayerCanvas,
  createMaskCanvas,
  createRasterLayer,
  duplicateLayerState,
  moveLayerToEdge,
  rasterizeTextLayer,
  reorderLayer,
  toggleLayerLock,
  translateRasterCanvas,
  DEFAULT_LAYER_STYLE,
  type LayerStyle,
  type PhotoLayer,
  type TextLayerData
} from '@/modules/photo';

type TextEditingState = {
  layerId: string;
  isNew: boolean;
  original: TextLayerData;
} | null;

// Layer CRUD: add/duplicate/delete/reorder/lock, layer-style copy-paste, text rasterization,
// nudge, merge-down, and mask add/delete. This is the largest single extraction (tightly
// related "layer" operations that all read/write `layers`, `buffersRef`, `masksRef`). Pulled
// out of PhotoEditor as a pure move (no behavior change).
export function usePhotoLayerActions({
  hasDoc,
  layers,
  activeLayerId,
  activeLayer,
  width,
  height,
  textEditing,
  buffersRef,
  masksRef,
  layerStyleClipboardRef,
  pushHistory,
  paint,
  updateTextLayer,
  setLayers,
  setActiveLayerId,
  setEditTarget,
  setTextEditing,
  setStatus
}: {
  hasDoc: boolean;
  layers: PhotoLayer[];
  activeLayerId: string;
  activeLayer: PhotoLayer | null;
  width: number;
  height: number;
  textEditing: TextEditingState;
  buffersRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  masksRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  layerStyleClipboardRef: MutableRefObject<LayerStyle | null>;
  pushHistory: (label: string) => void;
  paint: () => void;
  updateTextLayer: (id: string, changes: Partial<TextLayerData>) => void;
  setLayers: Dispatch<SetStateAction<PhotoLayer[]>>;
  setActiveLayerId: Dispatch<SetStateAction<string>>;
  setEditTarget: (target: 'layer' | 'mask') => void;
  setTextEditing: Dispatch<SetStateAction<TextEditingState>>;
  setStatus: (status: string) => void;
}) {
  const addLayer = useCallback(
    (name?: string) => {
      if (!hasDoc) return;
      pushHistory('New Layer');
      const layer = createRasterLayer(name ?? `Layer ${layers.filter(l => l.kind === 'raster').length}`);
      const id = layer.id;
      buffersRef.current.set(id, createLayerCanvas(width, height));
      setLayers(prev => [...prev, layer]);
      setActiveLayerId(id);
      setEditTarget('layer');
      setStatus(`New layer: ${layer.name}`);
    },
    [hasDoc, pushHistory, width, height, layers]
  );

  const addAdjustmentLayer = useCallback(() => {
    if (!hasDoc) return;
    pushHistory('Adjustment Layer');
    const layer = createAdjustmentLayer('brightnessContrast');
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(layer.id);
    setEditTarget('layer');
    setStatus('Brightness/Contrast');
  }, [hasDoc, pushHistory]);

  const addHueSaturationLayer = useCallback(() => {
    if (!hasDoc) return;
    pushHistory('Hue/Saturation Layer');
    const layer = createAdjustmentLayer('hueSaturation');
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(layer.id);
    setEditTarget('layer');
    setStatus('Hue/Saturation');
  }, [hasDoc, pushHistory]);

  const addLevelsLayer = useCallback(() => {
    if (!hasDoc) return;
    pushHistory('Levels Layer');
    const layer = createAdjustmentLayer('levels');
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(layer.id);
    setEditTarget('layer');
    setStatus('Levels');
  }, [hasDoc, pushHistory]);

  const duplicateLayer = useCallback(
    (id?: string) => {
      const srcId = id ?? activeLayerId;
      const src = layers.find(l => l.id === srcId);
      if (!src) return;
      pushHistory('Duplicate Layer');
      const duplicate = duplicateLayerState(layers, srcId, buffersRef.current, masksRef.current);
      if (!duplicate) return;
      setLayers(duplicate.layers);
      setActiveLayerId(duplicate.layer.id);
    },
    [activeLayerId, layers, pushHistory]
  );

  const copyLayerStyle = useCallback(
    (id?: string) => {
      const source = layers.find(layer => layer.id === (id ?? activeLayerId));
      if (!source || source.kind === 'adjustment') {
        setStatus('Select a raster or text layer');
        return;
      }
      layerStyleClipboardRef.current = cloneLayerStyle(source.style ?? DEFAULT_LAYER_STYLE);
      setStatus(`Copied style: ${source.name}`);
    },
    [activeLayerId, layers]
  );

  const pasteLayerStyle = useCallback(
    (id?: string) => {
      const targetId = id ?? activeLayerId;
      const target = layers.find(layer => layer.id === targetId);
      const copied = layerStyleClipboardRef.current;
      if (!target || target.kind === 'adjustment') {
        setStatus('Select a raster or text layer');
        return;
      }
      if (!copied) {
        setStatus('Copy a layer style first (Shift+F2)');
        return;
      }
      pushHistory('Paste Layer Style');
      setLayers(prev => prev.map(layer =>
        layer.id === targetId ? {...layer, style: cloneLayerStyle(copied)} : layer
      ));
      setStatus(`Pasted style: ${target.name}`);
    },
    [activeLayerId, layers, pushHistory]
  );

  const updateActiveLayerStyle = useCallback((style: LayerStyle) => {
    if (!activeLayerId) return;
    setLayers(prev => prev.map(layer => layer.id === activeLayerId ? {...layer, style} : layer));
  }, [activeLayerId]);

  const deleteLayer = useCallback(
    (id?: string) => {
      const target = id ?? activeLayerId;
      if (layers.length <= 1) {
        setStatus('Cannot delete the only layer');
        return;
      }
      pushHistory('Delete Layer');
      buffersRef.current.delete(target);
      masksRef.current.delete(target);
      if (textEditing?.layerId === target) setTextEditing(null);
      setLayers(prev => {
        const next = prev.filter(l => l.id !== target);
        if (activeLayerId === target) setActiveLayerId(next[next.length - 1]?.id ?? '');
        return next;
      });
      setEditTarget('layer');
    },
    [activeLayerId, layers.length, pushHistory, textEditing]
  );

  const moveLayerUp = useCallback(
    (id?: string) => {
      const target = id ?? activeLayerId;
      const idx = layers.findIndex(l => l.id === target);
      if (idx < 0 || idx >= layers.length - 1) return;
      pushHistory('Move Layer Up');
      setLayers(prev => reorderLayer(prev, target, 'up'));
    },
    [activeLayerId, layers, pushHistory]
  );

  const moveLayerDown = useCallback(
    (id?: string) => {
      const target = id ?? activeLayerId;
      const idx = layers.findIndex(l => l.id === target);
      if (idx <= 0) return;
      pushHistory('Move Layer Down');
      setLayers(prev => reorderLayer(prev, target, 'down'));
    },
    [activeLayerId, layers, pushHistory]
  );

  const setLayerEdge = useCallback((edge: 'front' | 'back', id = activeLayerId) => {
    if (!id) return;
    pushHistory(edge === 'front' ? 'Bring to Front' : 'Send to Back');
    setLayers(prev => moveLayerToEdge(prev, id, edge));
  }, [activeLayerId, pushHistory]);

  const toggleLock = useCallback((id = activeLayerId) => {
    if (!id) return;
    const layer = layers.find(item => item.id === id);
    pushHistory(layer?.locked ? 'Unlock Layer' : 'Lock Layer');
    setLayers(prev => toggleLayerLock(prev, id));
  }, [activeLayerId, layers, pushHistory]);

  const rasterizeText = useCallback((id = activeLayerId) => {
    const layer = layers.find(item => item.id === id);
    if (layer?.kind !== 'text') {
      setStatus('Select a text layer');
      return;
    }
    pushHistory('Rasterize Text');
    const result = rasterizeTextLayer(layers, id, buffersRef.current, width, height);
    if (result) {
      setLayers(result.layers);
      setTextEditing(prev => prev?.layerId === id ? null : prev);
      setStatus('Text rasterized');
    }
  }, [activeLayerId, layers, width, height, pushHistory]);

  const nudgeActiveLayer = useCallback((dx: number, dy: number) => {
    if (!activeLayer || activeLayer.locked || !hasDoc) return;
    pushHistory('Nudge Layer');
    if (activeLayer.kind === 'text' && activeLayer.text) {
      updateTextLayer(activeLayer.id, {x: activeLayer.text.x + dx, y: activeLayer.text.y + dy});
    } else if (activeLayer.kind === 'raster') {
      const source = buffersRef.current.get(activeLayer.id);
      if (source) buffersRef.current.set(activeLayer.id, translateRasterCanvas(source, dx, dy));
      if (activeLayer.hasMask && activeLayer.maskLinked) {
        const mask = masksRef.current.get(activeLayer.id);
        if (mask) masksRef.current.set(activeLayer.id, translateRasterCanvas(mask, dx, dy));
      }
      paint();
    }
  }, [activeLayer, hasDoc, pushHistory, updateTextLayer, paint]);

  const mergeDown = useCallback(() => {
    const idx = layers.findIndex(l => l.id === activeLayerId);
    if (idx <= 0) {
      setStatus('Nothing to merge');
      return;
    }
    const below = layers[idx - 1];
    const current = layers[idx];
    if (below.kind === 'adjustment' || current.kind === 'adjustment') {
      setStatus('Merge does not support adjustment layers');
      return;
    }
    let workingLayers = layers;
    if (below.kind === 'text') workingLayers = rasterizeTextLayer(workingLayers, below.id, buffersRef.current, width, height)?.layers ?? workingLayers;
    if (current.kind === 'text') workingLayers = rasterizeTextLayer(workingLayers, current.id, buffersRef.current, width, height)?.layers ?? workingLayers;
    const rasterBelow = workingLayers.find(layer => layer.id === below.id)!;
    const rasterCurrent = workingLayers.find(layer => layer.id === current.id)!;
    const belowCanvas = buffersRef.current.get(rasterBelow.id);
    const currentCanvas = buffersRef.current.get(rasterCurrent.id);
    if (!belowCanvas || !currentCanvas) return;
    pushHistory('Merge Down');
    let draw = currentCanvas;
    if (rasterCurrent.hasMask) {
      const mask = masksRef.current.get(rasterCurrent.id);
      if (mask) draw = applyMaskToCanvas(currentCanvas, mask);
    }
    const ctx = belowCanvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.globalAlpha = rasterCurrent.opacity;
      ctx.globalCompositeOperation = rasterCurrent.blendMode as GlobalCompositeOperation;
      ctx.drawImage(draw, 0, 0);
      ctx.restore();
    }
    buffersRef.current.delete(rasterCurrent.id);
    masksRef.current.delete(rasterCurrent.id);
    setLayers(workingLayers.filter(l => l.id !== rasterCurrent.id));
    setActiveLayerId(rasterBelow.id);
    setStatus('Merged down');
  }, [layers, activeLayerId, pushHistory, width, height]);

  const addMask = useCallback(() => {
    if (!activeLayer || activeLayer.kind !== 'raster' || activeLayer.hasMask) return;
    pushHistory('Add Mask');
    masksRef.current.set(activeLayer.id, createMaskCanvas(width, height, '#ffffff'));
    setLayers(prev => prev.map(l => (l.id === activeLayer.id ? {...l, hasMask: true} : l)));
    setEditTarget('mask');
    setStatus('Layer mask added');
  }, [activeLayer, pushHistory, width, height]);

  const deleteMask = useCallback(() => {
    if (!activeLayer?.hasMask) return;
    pushHistory('Delete Mask');
    masksRef.current.delete(activeLayer.id);
    setLayers(prev => prev.map(l => (l.id === activeLayer.id ? {...l, hasMask: false} : l)));
    setEditTarget('layer');
    setStatus('Mask deleted');
  }, [activeLayer, pushHistory]);

  return {
    addLayer,
    addAdjustmentLayer,
    addHueSaturationLayer,
    addLevelsLayer,
    duplicateLayer,
    copyLayerStyle,
    pasteLayerStyle,
    updateActiveLayerStyle,
    deleteLayer,
    moveLayerUp,
    moveLayerDown,
    setLayerEdge,
    toggleLock,
    rasterizeText,
    nudgeActiveLayer,
    mergeDown,
    addMask,
    deleteMask
  };
}
