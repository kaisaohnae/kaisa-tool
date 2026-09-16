import {type Dispatch, type MutableRefObject, type SetStateAction, useCallback} from 'react';
import {downloadBlob, replaceExtension} from '@/modules/shared/file';
import {
  canvasFromImageFile,
  deserializePhotoProject,
  exportComposite,
  nextDocId,
  serializePhotoProject,
  snapshotDocument,
  syncLayerSequence,
  DEFAULT_BG,
  DEFAULT_FG,
  type CompositeLayerInput,
  type HistorySnapshot,
  type PhotoGuide,
  type PhotoLayer
} from '@/modules/photo';
import type {DocumentSession} from './photo-editor';

// Open/save file I/O for the photo editor: opening a raster image or a .kphoto project (as a
// new document tab), saving the project back out, and exporting a flattened composite as
// PNG/JPEG. Pulled out of PhotoEditor as a pure move (no behavior change).
export function usePhotoFileIO({
  hasDoc,
  docName,
  width,
  height,
  activeLayerId,
  layers,
  fg,
  bg,
  showGrid,
  showRulers,
  snapEnabled,
  gridSize,
  guides,
  layerInputs,
  activeDocIdRef,
  sessionsRef,
  buffersRef,
  masksRef,
  selectionMaskRef,
  transformSourceRef,
  historyRef,
  historyIndexRef,
  createDocument,
  captureCurrentSession,
  setDocName,
  setWidth,
  setHeight,
  setLayers,
  setActiveLayerId,
  setFg,
  setBg,
  setShowGrid,
  setShowRulers,
  setSnapEnabled,
  setGridSize,
  setGuides,
  setSelection,
  setDraftSel,
  setCropDraft,
  setTransform,
  setTextEditing,
  setEditTarget,
  setZoom,
  setPan,
  setHasDoc,
  setDirty,
  setHistoryTick,
  setStatus,
  setDocTabs
}: {
  hasDoc: boolean;
  docName: string;
  width: number;
  height: number;
  activeLayerId: string;
  layers: PhotoLayer[];
  fg: string;
  bg: string;
  showGrid: boolean;
  showRulers: boolean;
  snapEnabled: boolean;
  gridSize: number;
  guides: PhotoGuide[];
  layerInputs: () => CompositeLayerInput[];
  activeDocIdRef: MutableRefObject<string>;
  sessionsRef: MutableRefObject<Map<string, DocumentSession>>;
  buffersRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  masksRef: MutableRefObject<Map<string, HTMLCanvasElement>>;
  selectionMaskRef: MutableRefObject<HTMLCanvasElement | null>;
  transformSourceRef: MutableRefObject<HTMLCanvasElement | null>;
  historyRef: MutableRefObject<HistorySnapshot[]>;
  historyIndexRef: MutableRefObject<number>;
  createDocument: (w: number, h: number, fill: 'white' | 'transparent' | 'bg', name?: string, seedCanvas?: HTMLCanvasElement) => void;
  captureCurrentSession: (id: string) => DocumentSession;
  setDocName: (name: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setLayers: Dispatch<SetStateAction<PhotoLayer[]>>;
  setActiveLayerId: (id: string) => void;
  setFg: (fg: string) => void;
  setBg: (bg: string) => void;
  setShowGrid: (value: boolean) => void;
  setShowRulers: (value: boolean) => void;
  setSnapEnabled: (value: boolean) => void;
  setGridSize: (value: number) => void;
  setGuides: (guides: PhotoGuide[]) => void;
  setSelection: Dispatch<SetStateAction<any>>;
  setDraftSel: Dispatch<SetStateAction<any>>;
  setCropDraft: Dispatch<SetStateAction<any>>;
  setTransform: Dispatch<SetStateAction<any>>;
  setTextEditing: Dispatch<SetStateAction<any>>;
  setEditTarget: (target: 'layer' | 'mask') => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: {x: number; y: number}) => void;
  setHasDoc: (value: boolean) => void;
  setDirty: (value: boolean) => void;
  setHistoryTick: Dispatch<SetStateAction<number>>;
  setStatus: (status: string) => void;
  setDocTabs: Dispatch<SetStateAction<{id: string; name: string; dirty: boolean}[]>>;
}) {
  const openFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const file = files?.[0];
      if (!file) return;
      try {
        if (/\.kphoto$/i.test(file.name)) {
          const project = await deserializePhotoProject(file);
          // Opening a project opens it as an additional tab, same as New Document.
          if (hasDoc && activeDocIdRef.current) {
            const outgoing = captureCurrentSession(activeDocIdRef.current);
            sessionsRef.current.set(outgoing.id, outgoing);
          }
          const docId = nextDocId();
          activeDocIdRef.current = docId;
          buffersRef.current = project.buffers;
          masksRef.current = project.masks;
          syncLayerSequence(project.layers);
          setDocName(project.name);
          setWidth(project.width);
          setHeight(project.height);
          setLayers(project.layers);
          setActiveLayerId(project.activeLayerId);
          setFg(project.settings.foreground ?? DEFAULT_FG);
          setBg(project.settings.background ?? DEFAULT_BG);
          setShowGrid(project.settings.showGrid ?? false);
          setShowRulers(project.settings.showRulers ?? false);
          setSnapEnabled(project.settings.snapEnabled ?? true);
          setGridSize(project.settings.gridSize ?? 50);
          setGuides(project.settings.guides ?? []);
          setSelection(null);
          selectionMaskRef.current = null;
          setDraftSel(null);
          setCropDraft(null);
          setTransform(null);
          transformSourceRef.current = null;
          setTextEditing(null);
          setEditTarget('layer');
          setZoom(Math.min(1, Math.max(0.2, Math.min((innerWidth - 360) / project.width, (innerHeight - 120) / project.height))));
          setPan({x: 0, y: 0});
          setHasDoc(true);
          setDirty(false);
          const snap = snapshotDocument(
            project.width,
            project.height,
            project.layers.map(layer => ({
              ...layer,
              canvas: project.buffers.get(layer.id) ?? null,
              mask: project.masks.get(layer.id) ?? null
            })),
            project.activeLayerId,
            'Open Project'
          );
          historyRef.current = [snap];
          historyIndexRef.current = 0;
          setHistoryTick(tick => tick + 1);
          setStatus(`Opened project: ${file.name}`);
          setDocTabs(tabs => [...tabs, {id: docId, name: project.name, dirty: false}]);
          return;
        }
        const canvas = await canvasFromImageFile(file);
        createDocument(
          canvas.width,
          canvas.height,
          'transparent',
          replaceExtension(file.name, 'png').replace(/\.png$/i, ''),
          canvas
        );
        setDirty(false);
        setStatus(`Opened ${file.name}`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Open failed');
      }
    },
    [createDocument, hasDoc, captureCurrentSession]
  );

  const saveProject = useCallback(async () => {
    if (!hasDoc) return;
    try {
      const blob = await serializePhotoProject({
        name: docName || 'Untitled',
        width,
        height,
        activeLayerId,
        layers,
        buffers: buffersRef.current,
        masks: masksRef.current,
        settings: {
          foreground: fg,
          background: bg,
          showGrid,
          showRulers,
          snapEnabled,
          gridSize,
          guides
        }
      });
      downloadBlob(blob, `${docName || 'Untitled'}.kphoto`);
      setDirty(false);
      setStatus('Project saved');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Project save failed');
    }
  }, [
    hasDoc,
    docName,
    width,
    height,
    activeLayerId,
    layers,
    fg,
    bg,
    showGrid,
    showRulers,
    snapEnabled,
    gridSize,
    guides
  ]);

  const saveAs = useCallback(
    async (mime: 'image/png' | 'image/jpeg') => {
      if (!hasDoc) return;
      try {
        const blob = await exportComposite(width, height, layerInputs(), mime);
        const ext = mime === 'image/png' ? 'png' : 'jpg';
        downloadBlob(blob, `${docName || 'export'}.${ext}`);
        setDirty(false);
        setStatus(`Saved ${ext.toUpperCase()}`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Save failed');
      }
    },
    [hasDoc, width, height, layerInputs, docName]
  );

  return {openFiles, saveProject, saveAs};
}
