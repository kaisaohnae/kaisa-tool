import {type Dispatch, type MutableRefObject, type RefObject, type SetStateAction, useCallback} from 'react';
import {
  clearSelectionArea,
  createLayerCanvas,
  drawTransformedImage,
  getOpaqueBounds,
  type PhotoLayer,
  type PhotoSelection,
  type PhotoTool,
  type TransformState
} from '@/modules/photo';

// Free-transform lifecycle for the active raster layer: begin cuts the selected (or opaque-bounds)
// region into a floating source canvas, apply draws it back transformed, cancel rolls back via
// history. Pulled out of PhotoEditor as a pure move (no behavior change).
export function usePhotoTransformTool({
  hasDoc,
  activeLayer,
  selection,
  width,
  height,
  transform,
  transformSourceRef,
  buffersRef,
  historyIndexRef,
  pushHistory,
  applyHistory,
  setTransform,
  setTool,
  setSelection,
  setStatus
}: {
  hasDoc: boolean;
  activeLayer: PhotoLayer | null;
  selection: PhotoSelection | null;
  width: number;
  height: number;
  transform: TransformState | null;
  transformSourceRef: MutableRefObject<HTMLCanvasElement | null>;
  buffersRef: RefObject<Map<string, HTMLCanvasElement>>;
  historyIndexRef: RefObject<number>;
  pushHistory: (label: string) => void;
  applyHistory: (index: number) => void;
  setTransform: Dispatch<SetStateAction<TransformState | null>>;
  setTool: (tool: PhotoTool) => void;
  setSelection: Dispatch<SetStateAction<PhotoSelection | null>>;
  setStatus: (status: string) => void;
}) {
  const beginTransform = useCallback(() => {
    if (!hasDoc || !activeLayer || activeLayer.kind !== 'raster') return;
    const canvas = buffersRef.current.get(activeLayer.id);
    if (!canvas) return;
    let box = selection;
    let source: HTMLCanvasElement;
    if (box && box.w > 0 && box.h > 0) {
      source = createLayerCanvas(box.w, box.h);
      const ctx = source.getContext('2d');
      if (ctx) ctx.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      clearSelectionArea(canvas, box);
    } else {
      const bounds = getOpaqueBounds(canvas) ?? {x: 0, y: 0, w: width, h: height};
      box = {shape: 'rect', ...bounds};
      source = createLayerCanvas(bounds.w, bounds.h);
      const ctx = source.getContext('2d');
      if (ctx) ctx.drawImage(canvas, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
      clearSelectionArea(canvas, {shape: 'rect', ...bounds});
    }
    pushHistory('Free Transform');
    transformSourceRef.current = source;
    setTransform({
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      rotation: 0,
      layerId: activeLayer.id
    });
    setTool('transform');
    setSelection(null);
    setStatus('Free Transform · Enter apply · Esc cancel');
  }, [hasDoc, activeLayer, selection, width, height, pushHistory]);

  const applyTransform = useCallback(() => {
    if (!transform || !transformSourceRef.current) return;
    const canvas = buffersRef.current.get(transform.layerId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawTransformedImage(
        ctx,
        transformSourceRef.current,
        transform.x,
        transform.y,
        transform.w,
        transform.h,
        transform.rotation
      );
    }
    setTransform(null);
    transformSourceRef.current = null;
    setTool('move');
    pushHistory('Transform');
    setStatus('Transform applied');
  }, [transform, pushHistory]);

  const cancelTransform = useCallback(() => {
    if (!transform || !transformSourceRef.current) {
      setTransform(null);
      return;
    }
    // Undo the cut by restoring from last history? We already pushed history before cut.
    // Re-apply previous history snapshot content for this layer is complex; simplest: undo once
    setTransform(null);
    transformSourceRef.current = null;
    if (historyIndexRef.current > 0) applyHistory(historyIndexRef.current - 1);
    setTool('move');
    setStatus('Transform cancelled');
  }, [transform, applyHistory]);

  return {beginTransform, applyTransform, cancelTransform};
}
