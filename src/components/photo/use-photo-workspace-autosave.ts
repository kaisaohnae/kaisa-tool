import {type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useEffect, useRef} from 'react';
import {
  clearWorkspace,
  deserializeDocument,
  loadWorkspace,
  saveWorkspace,
  serializeDocument,
  snapshotDocument,
  type LiveDocumentInput,
  type PhotoGuide,
  type PhotoLayer
} from '@/modules/photo';
import type {DocumentSession} from './photo-editor';

type DocTab = {id: string; name: string; dirty: boolean};

// Workspace autosave to IndexedDB: restoring whatever was auto-saved on mount, persisting the
// current workspace a short idle moment after anything changes, and flushing immediately right
// before the tab goes away. Pulled out of PhotoEditor as a pure move (no behavior change).
export function usePhotoWorkspaceAutosave({
  docTabs,
  docName,
  width,
  height,
  layers,
  activeLayerId,
  zoom,
  pan,
  guides,
  dirty,
  historyTick,
  sessionsRef,
  activeDocIdRef,
  buffersRef,
  masksRef,
  applySession,
  setDocTabs,
  setStatus
}: {
  docTabs: DocTab[];
  docName: string;
  width: number;
  height: number;
  layers: PhotoLayer[];
  activeLayerId: string;
  zoom: number;
  pan: {x: number; y: number};
  guides: PhotoGuide[];
  dirty: boolean;
  historyTick: number;
  sessionsRef: MutableRefObject<Map<string, DocumentSession>>;
  activeDocIdRef: MutableRefObject<string>;
  buffersRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  masksRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  applySession: (session: DocumentSession) => void;
  setDocTabs: Dispatch<SetStateAction<DocTab[]>>;
  setStatus: (status: string) => void;
}) {
  // Restores whatever was auto-saved (see the autosave effect below) so a browser refresh or
  // crash doesn't lose in-progress work. Runs once on mount, before the user can interact; undo
  // history isn't part of the save, so every restored document starts with one fresh entry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const workspace = await loadWorkspace();
        if (cancelled || !workspace || !workspace.documents.length) return;
        const restored = await Promise.all(workspace.documents.map(deserializeDocument));
        if (cancelled || !restored.length) return;
        const sessions: DocumentSession[] = restored.map(doc => {
          const snap = snapshotDocument(
            doc.width,
            doc.height,
            doc.layers.map(l => ({...l, canvas: doc.buffers.get(l.id) ?? null, mask: doc.masks.get(l.id) ?? null})),
            doc.activeLayerId,
            'Restored'
          );
          return {
            id: doc.id,
            docName: doc.docName,
            width: doc.width,
            height: doc.height,
            layers: doc.layers,
            activeLayerId: doc.activeLayerId,
            selection: null,
            draftSel: null,
            cropDraft: null,
            transform: null,
            editTarget: 'layer',
            zoom: doc.zoom,
            pan: doc.pan,
            dirty: doc.dirty,
            guides: doc.guides,
            buffers: doc.buffers,
            masks: doc.masks,
            selectionMask: null,
            history: [snap],
            historyIndex: 0
          };
        });
        const activeId =
          workspace.activeDocId && sessions.some(s => s.id === workspace.activeDocId) ? workspace.activeDocId : sessions[0].id;
        for (const session of sessions) {
          if (session.id !== activeId) sessionsRef.current.set(session.id, session);
        }
        activeDocIdRef.current = activeId;
        const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0];
        applySession(activeSession);
        setDocTabs(sessions.map(s => ({id: s.id, name: s.docName, dirty: s.dirty})));
        setStatus('Restored previous session');
      } catch (e) {
        console.error('Failed to restore auto-saved workspace', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-saves the current workspace (every open document's layers + canvases) to IndexedDB a
  // short idle moment after anything changes, so a refresh restores it via the effect above.
  // Undo/redo history is deliberately left out - only the current state of each document is kept.
  const persistWorkspaceNow = useCallback(async () => {
    try {
      if (!docTabs.length) {
        await clearWorkspace();
        return;
      }
      const activeId = activeDocIdRef.current;
      const liveDocs: LiveDocumentInput[] = [];
      if (activeId) {
        liveDocs.push({
          id: activeId,
          docName,
          width,
          height,
          layers,
          activeLayerId,
          zoom,
          pan,
          guides,
          dirty,
          buffers: buffersRef.current,
          masks: masksRef.current
        });
      }
      for (const session of sessionsRef.current.values()) {
        liveDocs.push({
          id: session.id,
          docName: session.docName,
          width: session.width,
          height: session.height,
          layers: session.layers,
          activeLayerId: session.activeLayerId,
          zoom: session.zoom,
          pan: session.pan,
          guides: session.guides,
          dirty: session.dirty,
          buffers: session.buffers,
          masks: session.masks
        });
      }
      const documents = await Promise.all(liveDocs.map(serializeDocument));
      await saveWorkspace({version: 1, activeDocId: activeId, documents, savedAt: Date.now()});
    } catch (e) {
      console.error('Autosave failed', e);
    }
  }, [docTabs, docName, width, height, layers, activeLayerId, zoom, pan, guides, dirty]);

  const autosaveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => { void persistWorkspaceNow(); }, 1500);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [historyTick, docTabs, persistWorkspaceNow]);

  // Best-effort immediate flush right before the tab actually goes away, so an edit made just
  // before a refresh isn't lost to the debounce above waiting out its 1.5s.
  useEffect(() => {
    const flush = () => { void persistWorkspaceNow(); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [persistWorkspaceNow]);

  return {persistWorkspaceNow};
}
