import {type Dispatch, type MutableRefObject, type SetStateAction, useCallback} from 'react';
import {
  clearSelectionArea,
  copySelectionArea,
  createLayerCanvas,
  createRasterLayer,
  fillSelectionArea,
  invertSelectionMask,
  selectionToMask,
  type PhotoLayer,
  type PhotoSelection,
  type PhotoTool,
  type SelectionShape
} from '@/modules/photo';

// Selection commands (select all/deselect/invert) and the clipboard/fill commands that operate
// through the current paint target (copy/cut/paste/fill). Pulled out of PhotoEditor as a pure
// move (no behavior change).
export function usePhotoSelectionActions({
  hasDoc,
  width,
  height,
  selection,
  activeLayerId,
  activeLayer,
  editTarget,
  fg,
  fgAlpha,
  selectionMaskRef,
  buffersRef,
  clipboardRef,
  getPaintTarget,
  pushHistory,
  paint,
  setSelection,
  setDraftSel,
  setCropDraft,
  setLayers,
  setActiveLayerId,
  setTool,
  setStatus
}: {
  hasDoc: boolean;
  width: number;
  height: number;
  selection: PhotoSelection | null;
  activeLayerId: string;
  activeLayer: PhotoLayer | null;
  editTarget: 'layer' | 'mask';
  fg: string;
  fgAlpha: number;
  selectionMaskRef: MutableRefObject<HTMLCanvasElement | null>;
  buffersRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  clipboardRef: MutableRefObject<HTMLCanvasElement | null>;
  getPaintTarget: () => HTMLCanvasElement | null;
  pushHistory: (label: string) => void;
  paint: () => void;
  setSelection: Dispatch<SetStateAction<PhotoSelection | null>>;
  setDraftSel: Dispatch<SetStateAction<PhotoSelection | null>>;
  setCropDraft: Dispatch<SetStateAction<PhotoSelection | null>>;
  setLayers: Dispatch<SetStateAction<PhotoLayer[]>>;
  setActiveLayerId: (id: string) => void;
  setTool: (tool: PhotoTool) => void;
  setStatus: (status: string) => void;
}) {
  const selectAll = useCallback(() => {
    if (!hasDoc) return;
    selectionMaskRef.current = null;
    setSelection({shape: 'rect', x: 0, y: 0, w: width, h: height});
    setStatus('Select all');
  }, [hasDoc, width, height]);

  const deselect = useCallback(() => {
    selectionMaskRef.current = null;
    setSelection(null);
    setDraftSel(null);
    setCropDraft(null);
  }, []);

  const invertSelection = useCallback(() => {
    if (!selection) return;
    const mask = selectionMaskRef.current ?? selectionToMask(selection, width, height);
    selectionMaskRef.current = invertSelectionMask(mask);
    setSelection({shape: 'rect', x: 0, y: 0, w: width, h: height});
    setStatus('Selection inverted');
  }, [selection, width, height]);

  const clearSelectionContent = useCallback(() => {
    const canvas = getPaintTarget();
    if (!canvas) return;
    pushHistory('Clear');
    clearSelectionArea(canvas, selection, selectionMaskRef.current);
    paint();
    setStatus('Cleared');
  }, [getPaintTarget, pushHistory, selection, paint]);

  const copySelection = useCallback(() => {
    const canvas = buffersRef.current.get(activeLayerId);
    if (!canvas || activeLayer?.kind !== 'raster') return;
    const sel = selection ?? {shape: 'rect' as SelectionShape, x: 0, y: 0, w: width, h: height};
    clipboardRef.current = copySelectionArea(canvas, sel, selectionMaskRef.current);
    setStatus('Copied');
  }, [activeLayerId, activeLayer, selection, width, height]);

  const cutSelection = useCallback(() => {
    copySelection();
    clearSelectionContent();
  }, [copySelection, clearSelectionContent]);

  const pasteClipboard = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || !hasDoc) return;
    pushHistory('Paste');
    const layer = createRasterLayer('Paste');
    const id = layer.id;
    const canvas = createLayerCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const ox = selection?.x ?? Math.round((width - clip.width) / 2);
    const oy = selection?.y ?? Math.round((height - clip.height) / 2);
    if (ctx) ctx.drawImage(clip, ox, oy);
    buffersRef.current.set(id, canvas);
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(id);
    setSelection({shape: 'rect', x: ox, y: oy, w: clip.width, h: clip.height});
    setTool('move');
    setStatus('Pasted');
  }, [hasDoc, pushHistory, width, height, selection]);

  const fillSelection = useCallback(() => {
    const canvas = getPaintTarget();
    if (!canvas) return;
    pushHistory('Fill');
    const color = editTarget === 'mask' ? '#ffffff' : fg;
    fillSelectionArea(canvas, selection, color, selectionMaskRef.current, editTarget === 'mask' ? 1 : fgAlpha / 100);
    paint();
  }, [getPaintTarget, pushHistory, selection, fg, fgAlpha, paint, editTarget]);

  return {selectAll, deselect, invertSelection, clearSelectionContent, copySelection, cutSelection, pasteClipboard, fillSelection};
}
