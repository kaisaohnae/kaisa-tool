import {type Dispatch, type MutableRefObject, type SetStateAction, useCallback} from 'react';
import {
  createLayerCanvas,
  createRasterLayer,
  nextDocId,
  nextDocName,
  snapshotDocument,
  type ContextMenuState,
  type HistorySnapshot,
  type PenAnchor,
  type PhotoGuide,
  type PhotoLayer,
  type PhotoSelection,
  type TextLayerData,
  type TransformState
} from '@/modules/photo';
import type {DocumentSession} from './photo-editor';

type DocTab = {id: string; name: string; dirty: boolean};
type TextEditingState = {layerId: string; isNew: boolean; original: TextLayerData} | null;

// Multi-document-tab machinery: capturing/restoring a document's full state into/out of
// `sessionsRef` when switching tabs, closing a tab, and creating a brand-new document (which
// also opens as an additional tab). Pulled out of PhotoEditor as a pure move (no behavior
// change) - this is the most state-heavy extraction since a "document" here means nearly every
// piece of per-document state the editor holds.
export function usePhotoDocumentSessions({
  hasDoc,
  dirty,
  docName,
  width,
  height,
  layers,
  activeLayerId,
  selection,
  draftSel,
  cropDraft,
  transform,
  editTarget,
  zoom,
  pan,
  guides,
  docTabs,
  bg,
  sessionsRef,
  activeDocIdRef,
  buffersRef,
  masksRef,
  selectionMaskRef,
  transformSourceRef,
  historyRef,
  historyIndexRef,
  drawingRef,
  cloneSourceRef,
  moveSourceRef,
  moveMaskSourceRef,
  setDocName,
  setWidth,
  setHeight,
  setLayers,
  setActiveLayerId,
  setSelection,
  setDraftSel,
  setCropDraft,
  setTransform,
  setEditTarget,
  setZoom,
  setPan,
  setGuides,
  setDirty,
  setHasDoc,
  setPenPath,
  setPenHover,
  setIsFilling,
  setZoomInputDraft,
  setContextMenu,
  setTextEditing,
  setHistoryTick,
  setStatus,
  setDocTabs
}: {
  hasDoc: boolean;
  dirty: boolean;
  docName: string;
  width: number;
  height: number;
  layers: PhotoLayer[];
  activeLayerId: string;
  selection: PhotoSelection | null;
  draftSel: PhotoSelection | null;
  cropDraft: PhotoSelection | null;
  transform: TransformState | null;
  editTarget: 'layer' | 'mask';
  zoom: number;
  pan: {x: number; y: number};
  guides: PhotoGuide[];
  docTabs: DocTab[];
  bg: string;
  sessionsRef: MutableRefObject<Map<string, DocumentSession>>;
  activeDocIdRef: MutableRefObject<string>;
  buffersRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  masksRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  selectionMaskRef: MutableRefObject<HTMLCanvasElement | null>;
  transformSourceRef: MutableRefObject<HTMLCanvasElement | null>;
  historyRef: MutableRefObject<HistorySnapshot[]>;
  historyIndexRef: MutableRefObject<number>;
  drawingRef: MutableRefObject<any>;
  cloneSourceRef: MutableRefObject<{x: number; y: number} | null>;
  moveSourceRef: MutableRefObject<HTMLCanvasElement | null>;
  moveMaskSourceRef: MutableRefObject<HTMLCanvasElement | null>;
  setDocName: (name: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setLayers: Dispatch<SetStateAction<PhotoLayer[]>>;
  setActiveLayerId: (id: string) => void;
  setSelection: Dispatch<SetStateAction<PhotoSelection | null>>;
  setDraftSel: Dispatch<SetStateAction<PhotoSelection | null>>;
  setCropDraft: Dispatch<SetStateAction<PhotoSelection | null>>;
  setTransform: Dispatch<SetStateAction<TransformState | null>>;
  setEditTarget: (target: 'layer' | 'mask') => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: {x: number; y: number}) => void;
  setGuides: (guides: PhotoGuide[]) => void;
  setDirty: (value: boolean) => void;
  setHasDoc: (value: boolean) => void;
  setPenPath: Dispatch<SetStateAction<PenAnchor[] | null>>;
  setPenHover: Dispatch<SetStateAction<{x: number; y: number} | null>>;
  setIsFilling: (value: boolean) => void;
  setZoomInputDraft: (value: string | null) => void;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
  setTextEditing: Dispatch<SetStateAction<TextEditingState>>;
  setHistoryTick: Dispatch<SetStateAction<number>>;
  setStatus: (status: string) => void;
  setDocTabs: Dispatch<SetStateAction<DocTab[]>>;
}) {
  // Bundles every piece of state that belongs to ONE document (as opposed to a global tool
  // preference like brush size or fg/bg color) so it can be parked while another tab is active.
  const captureCurrentSession = useCallback(
    (id: string): DocumentSession => ({
      id,
      docName,
      width,
      height,
      layers,
      activeLayerId,
      selection,
      draftSel,
      cropDraft,
      transform,
      editTarget,
      zoom,
      pan,
      dirty,
      guides,
      buffers: buffersRef.current,
      masks: masksRef.current,
      selectionMask: selectionMaskRef.current,
      history: historyRef.current,
      historyIndex: historyIndexRef.current
    }),
    [docName, width, height, layers, activeLayerId, selection, draftSel, cropDraft, transform, editTarget, zoom, pan, dirty, guides]
  );

  // Restores a parked DocumentSession into the live state/refs above, making it the active document.
  const applySession = useCallback((session: DocumentSession) => {
    buffersRef.current = session.buffers;
    masksRef.current = session.masks;
    selectionMaskRef.current = session.selectionMask;
    historyRef.current = session.history;
    historyIndexRef.current = session.historyIndex;
    setDocName(session.docName);
    setWidth(session.width);
    setHeight(session.height);
    setLayers(session.layers);
    setActiveLayerId(session.activeLayerId);
    setSelection(session.selection);
    setDraftSel(session.draftSel);
    setCropDraft(session.cropDraft);
    setTransform(session.transform);
    transformSourceRef.current = null;
    setEditTarget(session.editTarget);
    setZoom(session.zoom);
    setPan(session.pan);
    setDirty(session.dirty);
    setGuides(session.guides);
    setHasDoc(true);
    // Tool-interaction state is transient and shouldn't leak from one document into another.
    setPenPath(null);
    setPenHover(null);
    setIsFilling(false);
    setZoomInputDraft(null);
    setContextMenu(null);
    setTextEditing(null);
    drawingRef.current = null;
    cloneSourceRef.current = null;
    moveSourceRef.current = null;
    moveMaskSourceRef.current = null;
    setHistoryTick(t => t + 1);
    setStatus(session.docName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switches the active tab: parks the outgoing document's state and restores the target's.
  const switchToDocument = useCallback(
    (id: string) => {
      if (id === activeDocIdRef.current) return;
      const parked = sessionsRef.current.get(id);
      if (!parked) return;
      const outgoing = captureCurrentSession(activeDocIdRef.current);
      sessionsRef.current.set(outgoing.id, outgoing);
      sessionsRef.current.delete(id);
      activeDocIdRef.current = id;
      applySession(parked);
    },
    [captureCurrentSession, applySession]
  );

  // Closes a tab (prompting first if it has unsaved changes). Closing the active tab switches to
  // a neighboring tab, or clears the workspace back to the "no document" state if it was the last one.
  const closeDocument = useCallback(
    (id: string) => {
      const isActive = id === activeDocIdRef.current;
      const closingDirty = isActive ? dirty : sessionsRef.current.get(id)?.dirty ?? false;
      if (closingDirty && !window.confirm('This document has unsaved changes. Close it anyway?')) return;

      const idx = docTabs.findIndex(t => t.id === id);
      const remaining = docTabs.filter(t => t.id !== id);
      sessionsRef.current.delete(id);

      if (isActive) {
        const nextTab = docTabs[idx + 1] ?? docTabs[idx - 1] ?? null;
        if (nextTab) {
          const parked = sessionsRef.current.get(nextTab.id);
          activeDocIdRef.current = nextTab.id;
          if (parked) {
            sessionsRef.current.delete(nextTab.id);
            applySession(parked);
          }
        } else {
          activeDocIdRef.current = '';
          buffersRef.current = new Map();
          masksRef.current = new Map();
          selectionMaskRef.current = null;
          historyRef.current = [];
          historyIndexRef.current = -1;
          setHasDoc(false);
          setLayers([]);
          setActiveLayerId('');
          setSelection(null);
          setDraftSel(null);
          setCropDraft(null);
          setTransform(null);
          setDirty(false);
          setPenPath(null);
          setPenHover(null);
          setStatus('Ready');
        }
      }
      setDocTabs(remaining);
    },
    [docTabs, dirty, applySession]
  );

  const createDocument = useCallback(
    (w: number, h: number, fill: 'white' | 'transparent' | 'bg', name?: string, seedCanvas?: HTMLCanvasElement) => {
      // Photoshop-style: creating a new document opens it as an additional tab rather than
      // replacing whatever is already open, so park the current one first (if any).
      if (hasDoc && activeDocIdRef.current) {
        const outgoing = captureCurrentSession(activeDocIdRef.current);
        sessionsRef.current.set(outgoing.id, outgoing);
      }
      const layer = createRasterLayer('Background');
      const id = layer.id;
      const canvas =
        seedCanvas ??
        createLayerCanvas(w, h, fill === 'white' ? '#ffffff' : fill === 'bg' ? bg : undefined);
      buffersRef.current = new Map([[id, canvas]]);
      masksRef.current = new Map();
      const docId = nextDocId();
      activeDocIdRef.current = docId;
      const docLabel = name ?? nextDocName();
      setDocName(docLabel);
      setWidth(w);
      setHeight(h);
      setLayers([layer]);
      setActiveLayerId(id);
      setSelection(null);
      selectionMaskRef.current = null;
      setDraftSel(null);
      setCropDraft(null);
      setTransform(null);
      transformSourceRef.current = null;
      setEditTarget('layer');
      setZoom(Math.min(1, Math.max(0.2, Math.min((innerWidth - 360) / w, (innerHeight - 120) / h))));
      setPan({x: 0, y: 0});
      setGuides([]);
      setHasDoc(true);
      setDirty(false);
      const snap = snapshotDocument(w, h, [{...layer, canvas, mask: null}], id, 'New');
      historyRef.current = [snap];
      historyIndexRef.current = 0;
      setHistoryTick(t => t + 1);
      setStatus(`${w} × ${h}`);
      setDocTabs(tabs => [...tabs, {id: docId, name: docLabel, dirty: false}]);
    },
    [bg, hasDoc, captureCurrentSession]
  );

  return {captureCurrentSession, applySession, switchToDocument, closeDocument, createDocument};
}
