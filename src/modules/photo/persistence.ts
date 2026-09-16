import {createLayerCanvas} from './canvas';
import {cloneLayerStyle} from './layers';
import type {AdjustmentParams, AdjustmentType, BlendMode, LayerStyle, PhotoLayer, TextLayerData} from './types';
import type {PhotoGuide} from './guides';

// Auto-save/restore so a browser refresh (or crash) doesn't lose in-progress work. Everything is
// kept in IndexedDB (large binary-friendly storage, unlike localStorage): each open document's
// layer metadata plus its raster canvases (as PNG blobs, so transparency round-trips losslessly).
// Undo/redo history is intentionally NOT persisted (it can be large and isn't "the work" itself) -
// a restored document starts with a single fresh history entry, same as opening a saved project.

const DB_NAME = 'kaisa-photo-editor';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const WORKSPACE_KEY = 'current';

type PersistedLayer = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  kind: PhotoLayer['kind'];
  hasMask: boolean;
  maskLinked: boolean;
  blendMode: BlendMode;
  adjustment?: AdjustmentType;
  adjustmentParams?: AdjustmentParams;
  text?: TextLayerData;
  style?: LayerStyle;
  canvasBlob: Blob | null;
  maskBlob: Blob | null;
};

export type PersistedDocument = {
  id: string;
  docName: string;
  width: number;
  height: number;
  activeLayerId: string;
  zoom: number;
  pan: {x: number; y: number};
  guides: PhotoGuide[];
  dirty: boolean;
  layers: PersistedLayer[];
};

export type PersistedWorkspace = {
  version: 1;
  activeDocId: string;
  documents: PersistedDocument[];
  savedAt: number;
};

export type LiveDocumentInput = {
  id: string;
  docName: string;
  width: number;
  height: number;
  layers: PhotoLayer[];
  activeLayerId: string;
  zoom: number;
  pan: {x: number; y: number};
  guides: PhotoGuide[];
  dirty: boolean;
  buffers: Map<string, HTMLCanvasElement>;
  masks: Map<string, HTMLCanvasElement>;
};

export type RestoredDocument = {
  id: string;
  docName: string;
  width: number;
  height: number;
  layers: PhotoLayer[];
  activeLayerId: string;
  zoom: number;
  pan: {x: number; y: number};
  guides: PhotoGuide[];
  dirty: boolean;
  buffers: Map<string, HTMLCanvasElement>;
  masks: Map<string, HTMLCanvasElement>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
}

function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = createLayerCanvas(img.naturalWidth, img.naturalHeight);
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Failed to decode saved layer image')); };
    img.src = URL.createObjectURL(blob);
  });
}

export async function serializeDocument(doc: LiveDocumentInput): Promise<PersistedDocument> {
  const layers = await Promise.all(
    doc.layers.map(async layer => {
      const canvas = layer.kind === 'raster' ? doc.buffers.get(layer.id) ?? null : null;
      const mask = layer.hasMask ? doc.masks.get(layer.id) ?? null : null;
      const [canvasBlob, maskBlob] = await Promise.all([
        canvas ? canvasToBlob(canvas) : Promise.resolve(null),
        mask ? canvasToBlob(mask) : Promise.resolve(null)
      ]);
      const persistedLayer: PersistedLayer = {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        locked: layer.locked,
        kind: layer.kind,
        hasMask: layer.hasMask,
        maskLinked: layer.maskLinked,
        blendMode: layer.blendMode,
        adjustment: layer.adjustment,
        adjustmentParams: layer.adjustmentParams ? {...layer.adjustmentParams} : undefined,
        text: layer.text ? {...layer.text} : undefined,
        style: layer.style ? cloneLayerStyle(layer.style) : undefined,
        canvasBlob,
        maskBlob
      };
      return persistedLayer;
    })
  );
  return {
    id: doc.id,
    docName: doc.docName,
    width: doc.width,
    height: doc.height,
    activeLayerId: doc.activeLayerId,
    zoom: doc.zoom,
    pan: {...doc.pan},
    guides: doc.guides.map(g => ({...g})),
    dirty: doc.dirty,
    layers
  };
}

export async function deserializeDocument(doc: PersistedDocument): Promise<RestoredDocument> {
  const buffers = new Map<string, HTMLCanvasElement>();
  const masks = new Map<string, HTMLCanvasElement>();
  const layers: PhotoLayer[] = [];
  for (const l of doc.layers) {
    if (l.canvasBlob) buffers.set(l.id, await blobToCanvas(l.canvasBlob));
    if (l.maskBlob) masks.set(l.id, await blobToCanvas(l.maskBlob));
    layers.push({
      id: l.id,
      name: l.name,
      visible: l.visible,
      opacity: l.opacity,
      locked: l.locked,
      kind: l.kind,
      hasMask: l.hasMask,
      maskLinked: l.maskLinked,
      blendMode: l.blendMode,
      adjustment: l.adjustment,
      adjustmentParams: l.adjustmentParams,
      text: l.text,
      style: l.style
    });
  }
  return {
    id: doc.id,
    docName: doc.docName,
    width: doc.width,
    height: doc.height,
    layers,
    activeLayerId: doc.activeLayerId,
    zoom: doc.zoom,
    pan: doc.pan,
    guides: doc.guides,
    dirty: doc.dirty,
    buffers,
    masks
  };
}

export async function saveWorkspace(workspace: PersistedWorkspace): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(workspace, WORKSPACE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadWorkspace(): Promise<PersistedWorkspace | null> {
  const db = await openDb();
  try {
    return await new Promise<PersistedWorkspace | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(WORKSPACE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function clearWorkspace(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(WORKSPACE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
