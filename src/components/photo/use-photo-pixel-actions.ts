import {useCallback, type RefObject} from 'react';
import {fillSelectionArea, createLayerCanvas, drawTextLayer, selectionFromLayerAlpha, type PhotoLayer, type PhotoSelection, type PhotoTool} from '@/modules/photo';
type Props = {
  hasDoc: boolean; transform: unknown; textEditing: unknown; activeLayer: PhotoLayer | null;
  width: number; height: number; selection: PhotoSelection | null;
  selectionMaskRef: RefObject<HTMLCanvasElement | null>;
  buffersRef: RefObject<Map<string, HTMLCanvasElement>>;
  getPaintTarget: () => HTMLCanvasElement | null;
  pushHistory: (label: string) => void; paint: () => void;
  cancelTransform: () => void; commitTextEditing: () => void;
  setStatus: (value: string) => void; setSelection: (value: PhotoSelection | null) => void;
  setDraftSel: (value: PhotoSelection | null) => void; setCropDraft: (value: PhotoSelection | null) => void;
  setTool: (value: PhotoTool) => void;
};
export function usePhotoPixelActions({hasDoc, transform, textEditing, activeLayer, width, height, selection, selectionMaskRef, buffersRef, getPaintTarget, pushHistory, paint, cancelTransform, commitTextEditing, setStatus, setSelection, setDraftSel, setCropDraft, setTool}: Props) {
  const fillActiveLayer = useCallback((color: string, opacity = 100, preserveTransparency = false) => {
    if (!hasDoc || transform || activeLayer?.locked) return;
    const canvas = getPaintTarget();
    if (!canvas) {setStatus('Select an unlocked raster layer to fill'); return;}
    pushHistory('Fill');
    fillSelectionArea(canvas, selection, color, selectionMaskRef.current, opacity / 100, preserveTransparency);
    paint();
    setStatus(selection ? 'Selection filled' : 'Layer filled');
  }, [hasDoc, transform, activeLayer, getPaintTarget, pushHistory, selection, selectionMaskRef, paint, setStatus]);
  const selectLayerPixels = (layer: PhotoLayer) => {
    if (transform) cancelTransform();
    if (textEditing) commitTextEditing();
    let canvas = buffersRef.current.get(layer.id);
    if (layer.kind === 'text' && layer.text) {
      canvas = createLayerCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (ctx) drawTextLayer(ctx, layer.text);
    }
    if (!canvas || layer.kind === 'adjustment') {
      setStatus('This layer has no pixels to select');
      return;
    }
    const result = selectionFromLayerAlpha(canvas);
    selectionMaskRef.current = result?.mask ?? null;
    setSelection(result?.selection ?? null);
    setDraftSel(null);
    setCropDraft(null);
    setTool('select');
    setStatus(result ? `Selected pixels: ${layer.name}` : 'Layer is empty');
  };
  return {fillActiveLayer, selectLayerPixels};
}
