import {type Dispatch, type MutableRefObject, type RefObject, type SetStateAction, useCallback, useRef} from 'react';
import {
  clearSelectionArea,
  cloneCanvas,
  copySelectionArea,
  createLayerCanvas,
  drawTransformedImage,
  getOpaqueBounds,
  type PhotoLayer,
  type PhotoSelection,
  type PhotoTool,
  type TransformState
} from '@/modules/photo';

// Free-transform lifecycle for the active raster layer: begin cuts the selected (or opaque-bounds)
// region into a floating source canvas, apply draws it back transformed, and cancel restores
// the original layer canvas.
export function usePhotoTransformTool({
  hasDoc,
  activeLayer,
  selection,
  width,
  height,
  transform,
  transformSourceRef,
  selectionMaskRef,
  buffersRef,
  pushHistory,
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
  selectionMaskRef: MutableRefObject<HTMLCanvasElement | null>;
  buffersRef: RefObject<Map<string, HTMLCanvasElement>>;
  pushHistory: (label: string) => void;
  setTransform: Dispatch<SetStateAction<TransformState | null>>;
  setTool: (tool: PhotoTool) => void;
  setSelection: Dispatch<SetStateAction<PhotoSelection | null>>;
  setStatus: (status: string) => void;
}) {
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const beginTransform = useCallback(() => {
    if (transform || transformSourceRef.current) return;
    if (!hasDoc || !activeLayer) return;
    if (activeLayer.locked || activeLayer.kind !== 'raster') {
      setStatus(activeLayer.locked ? 'Unlock the layer before transforming' : 'Rasterize the text layer before transforming');
      return;
    }
    const canvas = buffersRef.current.get(activeLayer.id);
    if (!canvas) return;
    originalCanvasRef.current = cloneCanvas(canvas);
    pushHistory('Free Transform');
    let box = selection;
    let source: HTMLCanvasElement;
    if (box && box.w > 0 && box.h > 0) {
      source = copySelectionArea(canvas, box, selectionMaskRef.current);
      clearSelectionArea(canvas, box, selectionMaskRef.current);
    } else {
      const bounds = getOpaqueBounds(canvas) ?? {x: 0, y: 0, w: width, h: height};
      box = {shape: 'rect', ...bounds};
      source = createLayerCanvas(bounds.w, bounds.h);
      const ctx = source.getContext('2d');
      if (ctx) ctx.drawImage(canvas, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
      clearSelectionArea(canvas, {shape: 'rect', ...bounds});
    }
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
    selectionMaskRef.current = null;
    setStatus('Free Transform · Enter apply · Esc cancel');
  }, [hasDoc, activeLayer, selection, width, height, pushHistory, transform, selectionMaskRef]);

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
    originalCanvasRef.current = null;
    setStatus('Transform applied');
  }, [transform, pushHistory]);

  const cancelTransform = useCallback(() => {
    if (!transform || !transformSourceRef.current) {
      setTransform(null);
      return;
    }
    setTransform(null);
    transformSourceRef.current = null;
    if (originalCanvasRef.current) buffersRef.current.set(transform.layerId, originalCanvasRef.current);
    originalCanvasRef.current = null;
    setTool('move');
    setStatus('Transform cancelled');
  }, [transform, buffersRef]);

  return {beginTransform, applyTransform, cancelTransform};
}
