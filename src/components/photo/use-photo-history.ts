import {type MutableRefObject, type RefObject, useCallback, useRef} from 'react';
import {
  HISTORY_LIMIT,
  restoreSnapshot,
  snapshotDocument,
  type HistorySnapshot,
  type PhotoLayer,
  type PhotoSelection,
  type TransformState
} from '@/modules/photo';

// Undo/redo history for the active document. `historyRef`/`historyIndexRef` are exposed (not
// hidden inside the hook) because several other places in PhotoEditor read or directly overwrite
// them wholesale - parking/restoring a document session, closing a document, starting a fresh
// one, etc. Pulled out as a pure move: same refs, same callbacks, same behavior.
export function usePhotoHistory({
  width,
  height,
  layers,
  activeLayerId,
  buffersRef,
  masksRef,
  selectionMaskRef,
  transformSourceRef,
  setDirty,
  setHistoryTick,
  setWidth,
  setHeight,
  setLayers,
  setActiveLayerId,
  setSelection,
  setDraftSel,
  setTransform,
  setStatus
}: {
  width: number;
  height: number;
  layers: PhotoLayer[];
  activeLayerId: string;
  buffersRef: RefObject<Map<string, HTMLCanvasElement>>;
  masksRef: RefObject<Map<string, HTMLCanvasElement>>;
  selectionMaskRef: MutableRefObject<HTMLCanvasElement | null>;
  transformSourceRef: MutableRefObject<HTMLCanvasElement | null>;
  setDirty: (dirty: boolean) => void;
  setHistoryTick: (fn: (t: number) => number) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setLayers: (layers: PhotoLayer[]) => void;
  setActiveLayerId: (id: string) => void;
  setSelection: (selection: PhotoSelection | null) => void;
  setDraftSel: (selection: PhotoSelection | null) => void;
  setTransform: (transform: TransformState | null) => void;
  setStatus: (status: string) => void;
}) {
  const historyRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef(-1);

  const pushHistory = useCallback(
    (label = 'Edit') => {
      const snap = snapshotDocument(
        width,
        height,
        layers.map(l => ({
          ...l,
          canvas: buffersRef.current.get(l.id) ?? null,
          mask: masksRef.current.get(l.id) ?? null
        })),
        activeLayerId,
        label
      );
      const next = historyRef.current.slice(0, historyIndexRef.current + 1);
      next.push(snap);
      if (next.length > HISTORY_LIMIT) next.shift();
      historyRef.current = next;
      historyIndexRef.current = next.length - 1;
      setDirty(true);
      setHistoryTick(t => t + 1);
    },
    [width, height, layers, activeLayerId, buffersRef, masksRef, setDirty, setHistoryTick]
  );

  const applyHistory = useCallback((index: number) => {
    const snap = historyRef.current[index];
    if (!snap) return;
    const restored = restoreSnapshot(snap, buffersRef.current, masksRef.current);
    setWidth(snap.width);
    setHeight(snap.height);
    setLayers(restored.layers);
    setActiveLayerId(restored.activeLayerId);
    historyIndexRef.current = index;
    setSelection(null);
    selectionMaskRef.current = null;
    setDraftSel(null);
    setTransform(null);
    transformSourceRef.current = null;
    setDirty(true);
    setHistoryTick(t => t + 1);
    setStatus(snap.label);
  }, [
    buffersRef,
    masksRef,
    setWidth,
    setHeight,
    setLayers,
    setActiveLayerId,
    setSelection,
    selectionMaskRef,
    setDraftSel,
    setTransform,
    transformSourceRef,
    setDirty,
    setHistoryTick,
    setStatus
  ]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    applyHistory(historyIndexRef.current - 1);
  }, [applyHistory]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    applyHistory(historyIndexRef.current + 1);
  }, [applyHistory]);

  return {historyRef, historyIndexRef, pushHistory, applyHistory, undo, redo};
}
