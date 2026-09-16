'use client';

import {useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {PhotoMenubar, type PhotoMenuKey} from './photo-menubar';
import {PhotoLayerStylePanel} from './photo-layer-style-panel';
import {NewDocumentModal} from './photo-modals';
import {PhotoOptionsBar} from './photo-options-bar';
import {PhotoSidebar} from './photo-sidebar';
import {PhotoTextEditor} from './photo-text-editor';
import {PhotoToolbar} from './photo-toolbar';
import {downloadBlob, replaceExtension} from '@/modules/shared/file';
import {
  boxBlurCanvas,
  canvasFromImageFile,
  clearSelectionArea,
  compositeLayers,
  copySelectionArea,
  createLayerCanvas,
  createMaskCanvas,
  desaturateCanvas,
  drawBrushStroke,
  drawCloneStroke,
  drawLinearGradient,
  drawTransformedImage,
  deserializePhotoProject,
  deserializeDocument,
  serializeDocument,
  saveWorkspace,
  loadWorkspace,
  clearWorkspace,
  type LiveDocumentInput,
  exportComposite,
  fillSelectionArea,
  flipCanvas,
  floodFill,
  getOpaqueBounds,
  getTextLayerBounds,
  applyMaskToCanvas,
  drawTextLayer,
  cloneCanvas,
  invertCanvas,
  magicWandBounds,
  pathFromSelection,
  restoreSnapshot,
  rotateCanvas90,
  rgbaToHex,
  sharpenCanvas,
  snapshotDocument,
  type HistorySnapshot,
  type LayerStyle,
  BLEND_MODES,
  HISTORY_LIMIT,
  DEFAULT_ADJUSTMENT,
  DEFAULT_BG,
  DEFAULT_FG,
  DEFAULT_LAYER_STYLE,
  TOOL_SHORTCUTS,
  boundsFromPoints,
  clampZoom,
  stepZoomLevel,
  clientToDoc,
  createAdjustmentLayer,
  createRasterLayer,
  createTextLayer,
  cloneLayerStyle,
  duplicateLayerState,
  applyRetouchStamp,
  applyRetouchStroke,
  drawShape,
  drawVectorPath,
  tracePenPath,
  strokeSelectionArea,
  fitZoom as calculateFitZoom,
  getViewOrigin as calculateViewOrigin,
  loadNewDocumentSettings,
  nextDocId,
  nextDocName,
  rectFromDrag,
  reorderLayer,
  moveLayerToEdge,
  moveLayerBeside,
  toggleLayerLock,
  rasterizeTextLayer,
  translateRasterCanvas,
  saneGridSpacing,
  snapBox,
  snapPoint,
  serializePhotoProject,
  selectionToMask,
  saveNewDocumentSettings,
  syncLayerSequence,
  invertSelectionMask,
  toCompositeInputs,
  type BlendMode,
  type ContextMenuState,
  type PhotoLayer,
  type PenAnchor,
  type PhotoSelection,
  type PhotoTool,
  type PhotoGuide,
  type RetouchMode,
  type TextLayerData,
  type SelectionShape,
  type ShapeMode,
  type ShapeStyle,
  type TransformState
} from '@/modules/photo';

type MenuKey = PhotoMenuKey | null;
type TransformHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

// One open document's full state, parked in `sessionsRef` while another tab is active.
// The active document's state lives directly in this component's useState/useRef hooks (as
// before multi-document support existed); switching tabs captures the outgoing document into
// a DocumentSession and restores the incoming one from its parked session.
type DocumentSession = {
  id: string;
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
  dirty: boolean;
  guides: PhotoGuide[];
  buffers: Map<string, HTMLCanvasElement>;
  masks: Map<string, HTMLCanvasElement>;
  selectionMask: HTMLCanvasElement | null;
  history: HistorySnapshot[];
  historyIndex: number;
};

type DocTab = {id: string; name: string; dirty: boolean};

// Small live preview of a layer's current content, shown before its name in the layers list.
// `version` is a change counter (historyTick) the caller bumps on every edit, since the layer's
// canvas is mutated in place by drawing tools and isn't itself React state.
function LayerThumb({
  layer,
  buffers,
  masks,
  docWidth,
  docHeight,
  version
}: {
  layer: PhotoLayer;
  buffers: Map<string, HTMLCanvasElement>;
  masks: Map<string, HTMLCanvasElement>;
  docWidth: number;
  docHeight: number;
  version: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const tw = canvas.width, th = canvas.height;
    ctx.clearRect(0, 0, tw, th);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, tw, th);
    ctx.fillStyle = '#4a4a4a';
    for (let y = 0; y < th; y += 4) {
      for (let x = (Math.round(y / 4) % 2 ? 0 : 4); x < tw; x += 8) ctx.fillRect(x, y, 4, 4);
    }
    if (docWidth <= 0 || docHeight <= 0) return;
    const scale = Math.min(tw / docWidth, th / docHeight);
    const dw = docWidth * scale, dh = docHeight * scale;
    const dx = (tw - dw) / 2, dy = (th - dh) / 2;
    if (layer.kind === 'raster') {
      const src = buffers.get(layer.id);
      if (!src) return;
      const mask = layer.hasMask ? masks.get(layer.id) : null;
      ctx.drawImage(mask ? applyMaskToCanvas(src, mask) : src, dx, dy, dw, dh);
    } else if (layer.kind === 'text' && layer.text) {
      const tmp = createLayerCanvas(docWidth, docHeight);
      const tctx = tmp.getContext('2d');
      if (tctx) drawTextLayer(tctx, layer.text);
      ctx.drawImage(tmp, dx, dy, dw, dh);
    } else if (layer.kind === 'adjustment') {
      ctx.fillStyle = '#cfd6dd';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u25c6', tw / 2, th / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.id, layer.kind, layer.hasMask, layer.text, buffers, masks, docWidth, docHeight, version]);
  return <canvas ref={canvasRef} width={30} height={22} className="photo-layer__thumb" />;
}

export default function PhotoEditor() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buffersRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const masksRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const selectionMaskRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const drawingRef = useRef<{
    lastX: number;
    lastY: number;
    mode: string;
    startX: number;
    startY: number;
    handle?: TransformHandle;
    startBox?: {x: number; y: number; w: number; h: number};
    cloneOffsetX?: number;
    cloneOffsetY?: number;
    lassoPoints?: {x: number; y: number}[];
    selectionStart?: PhotoSelection | null;
    anchorIndex?: number;
  } | null>(null);
  const spacePanRef = useRef(false);
  const clipboardRef = useRef<HTMLCanvasElement | null>(null);
  const layerStyleClipboardRef = useRef<LayerStyle | null>(null);
  const transformSourceRef = useRef<HTMLCanvasElement | null>(null);
  const cloneSourceRef = useRef<{x: number; y: number} | null>(null);
  const moveSourceRef = useRef<HTMLCanvasElement | null>(null);
  const moveMaskSourceRef = useRef<HTMLCanvasElement | null>(null);

  // Multi-document tabs: `sessionsRef` holds every OPEN document that isn't currently active
  // (the active one lives in the state/refs above); `docTabs` is just the lightweight list used
  // to render the tab strip, and `activeDocIdRef` is the stable id of whichever document's
  // state currently lives in those hooks above.
  const sessionsRef = useRef<Map<string, DocumentSession>>(new Map());
  const activeDocIdRef = useRef('');
  const [docTabs, setDocTabs] = useState<DocTab[]>([]);

  const [docName, setDocName] = useState(nextDocName());
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [layers, setLayers] = useState<PhotoLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState('');
  const [tool, setTool] = useState<PhotoTool>('move');
  const [fg, setFg] = useState(DEFAULT_FG);
  const [bg, setBg] = useState(DEFAULT_BG);
  const [fgAlpha, setFgAlpha] = useState(100);
  const [bgAlpha, setBgAlpha] = useState(100);
  const [brushSize, setBrushSize] = useState(12);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [retouchStrength, setRetouchStrength] = useState(35);
  const [shapeMode, setShapeMode] = useState<ShapeMode>('rect');
  const [shapeStyle, setShapeStyle] = useState<ShapeStyle>('fill');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [selection, setSelection] = useState<PhotoSelection | null>(null);
  const [draftSel, setDraftSel] = useState<PhotoSelection | null>(null);
  const [cropDraft, setCropDraft] = useState<PhotoSelection | null>(null);
  const [transform, setTransform] = useState<TransformState | null>(null);
  const [editTarget, setEditTarget] = useState<'layer' | 'mask'>('layer');
  const [menuOpen, setMenuOpen] = useState<MenuKey>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [cursor, setCursor] = useState({x: 0, y: 0});
  const [altPressed, setAltPressed] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [penPath, setPenPath] = useState<PenAnchor[] | null>(null);
  const [penHover, setPenHover] = useState<{x: number; y: number} | null>(null);
  const [zoomInputDraft, setZoomInputDraft] = useState<string | null>(null);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [hasDoc, setHasDoc] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [newW, setNewW] = useState(1200);
  const [newH, setNewH] = useState(800);
  const [newFill, setNewFill] = useState<'white' | 'transparent' | 'bg'>('white');
  const [renameId, setRenameId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [textEditing, setTextEditing] = useState<{
    layerId: string;
    isNew: boolean;
    original: TextLayerData;
  } | null>(null);
  const [textFontFamily, setTextFontFamily] = useState('Arial');
  const [textFontSize, setTextFontSize] = useState(32);
  const [textFontWeight, setTextFontWeight] = useState<'normal' | 'bold'>('normal');
  const [textFontStyle, setTextFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textTracking, setTextTracking] = useState(0);
  const [textLineHeight, setTextLineHeight] = useState(1.2);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textStrokeWidth, setTextStrokeWidth] = useState(0);
  const [textStrokeColor, setTextStrokeColor] = useState('#000000');
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [guides, setGuides] = useState<PhotoGuide[]>([]);
  const [status, setStatus] = useState('Ready');
  const [historyTick, setHistoryTick] = useState(0);
  const [sidebarTab, setSidebarTab] = useState<'layers' | 'history'>('layers');

  const activeLayer = layers.find(l => l.id === activeLayerId) ?? null;
  const liveSel = draftSel ?? selection;
  const historyEntries = historyRef.current;
  const historyIndex = historyIndexRef.current;

  const layerInputs = useCallback(() => {
    const inputs = toCompositeInputs(layers, buffersRef.current, masksRef.current, width, height);
    return textEditing
      ? inputs.map((input, index) => layers[index]?.id === textEditing.layerId ? {...input, visible: false} : input)
      : inputs;
  }, [layers, width, height, textEditing]);

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
    [width, height, layers, activeLayerId]
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
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    applyHistory(historyIndexRef.current - 1);
  }, [applyHistory]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    applyHistory(historyIndexRef.current + 1);
  }, [applyHistory]);

  const updateTextLayer = useCallback((id: string, changes: Partial<TextLayerData>) => {
    setLayers(prev => prev.map(layer =>
      layer.id === id && layer.kind === 'text' && layer.text
        ? {...layer, text: {...layer.text, ...changes}}
        : layer
    ));
  }, []);

  const startTextEditing = useCallback((layer: PhotoLayer, isNew = false) => {
    if (layer.kind !== 'text' || !layer.text || layer.locked) return;
    if (!isNew) pushHistory('Edit Text');
    setActiveLayerId(layer.id);
    setEditTarget('layer');
    setTool('text');
    setTextFontFamily(layer.text.fontFamily);
    setTextFontSize(layer.text.fontSize);
    setTextFontWeight(layer.text.fontWeight);
    setTextFontStyle(layer.text.fontStyle);
    setTextAlign(layer.text.align);
    setTextTracking(layer.text.tracking);
    setTextLineHeight(layer.text.lineHeight);
    setTextUnderline(layer.text.underline);
    setTextStrokeWidth(layer.text.strokeWidth);
    setTextStrokeColor(layer.text.strokeColor);
    setTextEditing({layerId: layer.id, isNew, original: {...layer.text}});
  }, [pushHistory]);

  const commitTextEditing = useCallback(() => {
    if (!textEditing) return;
    const layer = layers.find(item => item.id === textEditing.layerId);
    if (textEditing.isNew && !layer?.text?.content.trim()) {
      setLayers(prev => prev.filter(item => item.id !== textEditing.layerId));
      setActiveLayerId(prev => prev === textEditing.layerId ? layers.find(item => item.id !== textEditing.layerId)?.id ?? '' : prev);
    } else if (layer?.text?.content.trim()) {
      const label = layer.text.content.split('\n')[0].trim().slice(0, 36);
      setLayers(prev => prev.map(item => item.id === layer.id && item.name === 'Text' ? {...item, name: label || 'Text'} : item));
    }
    setTextEditing(null);
    setStatus('Text committed');
  }, [layers, textEditing]);

  const cancelTextEditing = useCallback(() => {
    if (!textEditing) return;
    if (textEditing.isNew) {
      setLayers(prev => prev.filter(item => item.id !== textEditing.layerId));
      setActiveLayerId(prev => prev === textEditing.layerId ? layers.find(item => item.id !== textEditing.layerId)?.id ?? '' : prev);
    } else {
      updateTextLayer(textEditing.layerId, textEditing.original);
    }
    setTextEditing(null);
    setStatus('Text editing cancelled');
  }, [layers, textEditing, updateTextLayer]);

  useEffect(() => {
    if (textEditing && tool !== 'text') commitTextEditing();
  }, [tool, textEditing, commitTextEditing]);

  useEffect(() => {
    if (penPath && tool !== 'pen') {
      setPenPath(null);
      setPenHover(null);
    }
  }, [tool, penPath]);

  const getDocPoint = useCallback(
    (clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return {x: 0, y: 0};
      const rect = viewport.getBoundingClientRect();
      return clientToDoc(clientX, clientY, rect, pan, zoom, width, height);
    },
    [pan, width, height, zoom]
  );

  const snapDocPoint = useCallback((point: {x: number; y: number}) => {
    if (!snapEnabled) return point;
    return snapPoint(point, {guides, gridSize, zoom});
  }, [snapEnabled, guides, gridSize, zoom]);

  const getViewOrigin = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return {dx: 0, dy: 0, vw: 0, vh: 0};
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    return calculateViewOrigin(vw, vh, pan, zoom, width, height);
  }, [pan, width, height, zoom]);

  const paint = useCallback(() => {
    const view = viewCanvasRef.current;
    const viewport = viewportRef.current;
    if (!view || !viewport || !hasDoc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const {dx, dy, vw, vh} = getViewOrigin();
    view.width = Math.max(1, Math.floor(vw * dpr));
    view.height = Math.max(1, Math.floor(vh * dpr));
    view.style.width = `${vw}px`;
    view.style.height = `${vh}px`;
    const ctx = view.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, vw, vh);

    const composed = compositeLayers(width, height, layerInputs());

    const cell = 8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, width * zoom, height * zoom);
    ctx.clip();
    for (let y = dy; y < dy + height * zoom; y += cell) {
      for (let x = dx; x < dx + width * zoom; x += cell) {
        const cx = Math.floor((x - dx) / cell);
        const cy = Math.floor((y - dy) / cell);
        ctx.fillStyle = (cx + cy) % 2 === 0 ? '#ffffff' : '#d0d0d0';
        ctx.fillRect(x, y, cell, cell);
      }
    }
    ctx.restore();

    ctx.imageSmoothingEnabled = zoom < 1;
    ctx.drawImage(composed, dx, dy, width * zoom, height * zoom);

    if (showGrid) {
      const spacing = saneGridSpacing(gridSize, zoom);
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, width * zoom, height * zoom);
      ctx.clip();
      ctx.strokeStyle = 'rgba(40,160,220,0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += spacing) {
        const screenX = Math.round(dx + x * zoom) + 0.5;
        ctx.moveTo(screenX, dy); ctx.lineTo(screenX, dy + height * zoom);
      }
      for (let y = 0; y <= height; y += spacing) {
        const screenY = Math.round(dy + y * zoom) + 0.5;
        ctx.moveTo(dx, screenY); ctx.lineTo(dx + width * zoom, screenY);
      }
      ctx.stroke();
      ctx.restore();
    }
    if (guides.length) {
      ctx.save();
      ctx.beginPath(); ctx.rect(dx, dy, width * zoom, height * zoom); ctx.clip();
      ctx.strokeStyle = '#00d8ff'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const guide of guides) {
        if (guide.orientation === 'vertical') {
          const x = Math.round(dx + guide.position * zoom) + 0.5;
          ctx.moveTo(x, dy); ctx.lineTo(x, dy + height * zoom);
        } else {
          const y = Math.round(dy + guide.position * zoom) + 0.5;
          ctx.moveTo(dx, y); ctx.lineTo(dx + width * zoom, y);
        }
      }
      ctx.stroke(); ctx.restore();
    }

    if (transform && transformSourceRef.current) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.scale(zoom, zoom);
      drawTransformedImage(
        ctx,
        transformSourceRef.current,
        transform.x,
        transform.y,
        transform.w,
        transform.h,
        transform.rotation
      );
      ctx.restore();
      const sx = dx + transform.x * zoom;
      const sy = dy + transform.y * zoom;
      const sw = transform.w * zoom;
      const sh = transform.h * zoom;
      ctx.strokeStyle = '#55aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
      const handles = [
        [sx, sy],
        [sx + sw / 2, sy],
        [sx + sw, sy],
        [sx, sy + sh / 2],
        [sx + sw, sy + sh / 2],
        [sx, sy + sh],
        [sx + sw / 2, sy + sh],
        [sx + sw, sy + sh]
      ];
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#2288dd';
      for (const [hx, hy] of handles) {
        ctx.fillRect(hx - 3, hy - 3, 6, 6);
        ctx.strokeRect(hx - 3, hy - 3, 6, 6);
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx - 0.5, dy - 0.5, width * zoom + 1, height * zoom + 1);

    const sel = cropDraft ?? liveSel;
    if (!transform && sel && (sel.w > 0 || sel.shape === 'lasso')) {
      const hasArea = sel.shape === 'lasso' ? (sel.points?.length ?? 0) > 2 : sel.w > 0 && sel.h > 0;
      if (hasArea) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(dx, dy, width * zoom, height * zoom);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.translate(dx, dy);
        ctx.scale(zoom, zoom);
        pathFromSelection(ctx, sel);
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.translate(dx, dy);
        ctx.scale(zoom, zoom);
        pathFromSelection(ctx, sel);
        ctx.clip();
        ctx.drawImage(composed, 0, 0);
        ctx.restore();
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.scale(zoom, zoom);
        pathFromSelection(ctx, sel);
        ctx.stroke();
        ctx.restore();
        ctx.setLineDash([]);
        if (cropDraft) {
          ctx.fillStyle = 'rgba(255,200,0,0.9)';
          ctx.font = '12px sans-serif';
          const labelY = cropDraft.shape === 'lasso' ? dy + cropDraft.y * zoom : dy + cropDraft.y * zoom;
          ctx.fillText('Enter: crop · Esc: cancel', dx + cropDraft.x * zoom, Math.max(14, labelY - 6));
        }
      }
    }

    if (penPath && penPath.length) {
      const toScreen = (p: {x: number; y: number}) => ({x: dx + p.x * zoom, y: dy + p.y * zoom});
      ctx.save();
      ctx.strokeStyle = '#55aaff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const screenAnchors = penPath.map(a => ({
        x: toScreen(a).x,
        y: toScreen(a).y,
        handle: a.handle ? toScreen(a.handle) : null
      }));
      tracePenPath(ctx, screenAnchors, false);
      ctx.stroke();

      if (penHover) {
        const last = penPath[penPath.length - 1];
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        tracePenPath(ctx, [
          {x: toScreen(last).x, y: toScreen(last).y, handle: last.handle ? toScreen(last.handle) : null},
          {x: toScreen(penHover).x, y: toScreen(penHover).y, handle: null}
        ], false);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      penPath.forEach((anchor, index) => {
        const sp = toScreen(anchor);
        if (anchor.handle) {
          const hp = toScreen(anchor.handle);
          ctx.strokeStyle = '#55aaff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(hp.x, hp.y);
          ctx.stroke();
          ctx.fillStyle = '#55aaff';
          ctx.beginPath();
          ctx.arc(hp.x, hp.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        const isFirst = index === 0;
        const closeHover = isFirst && penHover && penPath.length >= 2
          && Math.hypot(penHover.x - anchor.x, penHover.y - anchor.y) <= Math.max(4, 6 / zoom);
        ctx.fillStyle = closeHover ? '#ffcc33' : '#ffffff';
        ctx.strokeStyle = '#2288dd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, closeHover ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      ctx.fillStyle = 'rgba(85,170,255,0.95)';
      ctx.font = '12px sans-serif';
      const firstScreen = toScreen(penPath[0]);
      ctx.fillText('Enter/dbl-click: finish · click first point: close · Esc: cancel', firstScreen.x, Math.max(14, firstScreen.y - 10));
    }

    if (showRulers) {
      const ruler = 20;
      const step = saneGridSpacing(Math.min(gridSize, 50), zoom, 48);
      ctx.fillStyle = '#30343a';
      ctx.fillRect(0, 0, vw, ruler);
      ctx.fillRect(0, 0, ruler, vh);
      ctx.strokeStyle = '#9ca8b5';
      ctx.fillStyle = '#cbd3dc';
      ctx.font = '9px ui-monospace, monospace';
      ctx.beginPath();
      for (let value = 0; value <= width; value += step) {
        const x = dx + value * zoom;
        if (x < ruler || x > vw) continue;
        ctx.moveTo(x + .5, ruler); ctx.lineTo(x + .5, 12);
        ctx.fillText(String(Math.round(value)), x + 2, 9);
      }
      for (let value = 0; value <= height; value += step) {
        const y = dy + value * zoom;
        if (y < ruler || y > vh) continue;
        ctx.moveTo(ruler, y + .5); ctx.lineTo(12, y + .5);
        ctx.save(); ctx.translate(8, y + 2); ctx.rotate(-Math.PI / 2); ctx.fillText(String(Math.round(value)), 0, 0); ctx.restore();
      }
      ctx.stroke();
      ctx.fillStyle = '#25282c'; ctx.fillRect(0, 0, ruler, ruler);
    }
  }, [hasDoc, width, height, layerInputs, pan, zoom, liveSel, cropDraft, transform, getViewOrigin, showGrid, showRulers, gridSize, guides, penPath, penHover]);

  useEffect(() => {
    paint();
  }, [paint, historyTick]);

  useEffect(() => {
    document.body.classList.add('photo-mode');
    return () => document.body.classList.remove('photo-mode');
  }, []);

  useEffect(() => {
    const saved = loadNewDocumentSettings();
    setNewW(saved.width);
    setNewH(saved.height);
    setNewFill(saved.fill);
  }, []);

  useEffect(() => {
    const onResize = () => paint();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paint]);

  const getPaintTarget = useCallback(() => {
    if (!activeLayerId || !activeLayer) return null;
    if (activeLayer.kind !== 'raster') return null;
    if (editTarget === 'mask') {
      if (!activeLayer.hasMask) return null;
      return masksRef.current.get(activeLayerId) ?? null;
    }
    if (activeLayer.locked) return null;
    return buffersRef.current.get(activeLayerId) ?? null;
  }, [activeLayerId, activeLayer, editTarget]);

  const finishPenPath = useCallback((closed: boolean) => {
    const anchors = penPath;
    const canvas = getPaintTarget();
    if (anchors && anchors.length >= 2 && canvas) {
      const penMask = selection ? (selectionMaskRef.current ?? selectionToMask(selection, width, height)) : null;
      pushHistory('Pen Path');
      drawVectorPath(canvas, anchors, closed, shapeStyle, fg, bg, shapeStrokeWidth, selection, penMask, fgAlpha / 100, bgAlpha / 100);
      paint();
      setStatus('Pen path applied');
    }
    setPenPath(null);
    setPenHover(null);
    drawingRef.current = null;
  }, [penPath, getPaintTarget, selection, width, height, shapeStyle, fg, bg, fgAlpha, bgAlpha, shapeStrokeWidth, paint, pushHistory]);

  const cancelPenPath = useCallback(() => {
    setPenPath(null);
    setPenHover(null);
    drawingRef.current = null;
    setStatus('Pen path cancelled');
  }, []);

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

  // Keeps the active tab's label/dirty-dot in sync with the live docName/dirty state, so a
  // rename or edit shows up on its tab immediately without any extra plumbing at each call site.
  useEffect(() => {
    if (!activeDocIdRef.current) return;
    const activeId = activeDocIdRef.current;
    setDocTabs(tabs =>
      tabs.map(t => (t.id === activeId && (t.name !== docName || t.dirty !== dirty) ? {...t, name: docName, dirty} : t))
    );
  }, [docName, dirty]);

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

  const hitTransformHandle = (pt: {x: number; y: number}, box: {x: number; y: number; w: number; h: number}): TransformHandle | null => {
    const tol = 8 / zoom;
    const points: {h: TransformHandle; x: number; y: number}[] = [
      {h: 'nw', x: box.x, y: box.y},
      {h: 'n', x: box.x + box.w / 2, y: box.y},
      {h: 'ne', x: box.x + box.w, y: box.y},
      {h: 'w', x: box.x, y: box.y + box.h / 2},
      {h: 'e', x: box.x + box.w, y: box.y + box.h / 2},
      {h: 'sw', x: box.x, y: box.y + box.h},
      {h: 's', x: box.x + box.w / 2, y: box.y + box.h},
      {h: 'se', x: box.x + box.w, y: box.y + box.h}
    ];
    for (const p of points) {
      if (Math.hypot(pt.x - p.x, pt.y - p.y) <= tol) return p.h;
    }
    if (pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h) return 'move';
    return null;
  };

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

  const getActiveRasterCanvas = useCallback(() => {
    if (!activeLayer || activeLayer.kind !== 'raster') return null;
    return buffersRef.current.get(activeLayer.id) ?? null;
  }, [activeLayer]);

  const applyFilterToActiveLayer = useCallback(
    (label: string, fn: (canvas: HTMLCanvasElement) => void) => {
      const canvas = getActiveRasterCanvas();
      if (!canvas) {
        setStatus('Select a raster layer');
        return;
      }
      pushHistory(label);
      fn(canvas);
      paint();
      setStatus(label);
    },
    [getActiveRasterCanvas, pushHistory, paint]
  );

  const flipActiveLayer = useCallback((horizontal: boolean) => {
    const canvas = getActiveRasterCanvas();
    if (!canvas || !activeLayer) {
      setStatus('Select a raster layer');
      return;
    }
    const label = horizontal ? 'Flip Horizontal' : 'Flip Vertical';
    pushHistory(label);
    flipCanvas(canvas, horizontal);
    if (activeLayer.hasMask && activeLayer.maskLinked) {
      const mask = masksRef.current.get(activeLayer.id);
      if (mask) flipCanvas(mask, horizontal);
    }
    paint();
    setStatus(label);
  }, [activeLayer, getActiveRasterCanvas, paint, pushHistory]);

  const applyRotate90 = useCallback(
    (clockwise: boolean) => {
      const canvas = getActiveRasterCanvas();
      if (!canvas) {
        setStatus('Select a raster layer');
        return;
      }
      pushHistory(clockwise ? 'Rotate 90° CW' : 'Rotate 90° CCW');
      const rotated = rotateCanvas90(canvas, clockwise);
      if (layers.length === 1) {
        buffersRef.current.set(activeLayerId, rotated);
        if (activeLayer?.hasMask) {
          const mask = masksRef.current.get(activeLayerId);
          if (mask) masksRef.current.set(activeLayerId, rotateCanvas90(mask, clockwise));
        }
        setWidth(rotated.width);
        setHeight(rotated.height);
      } else {
        const next = createLayerCanvas(width, height);
        const ctx = next.getContext('2d');
        if (ctx) {
          const ox = Math.round((width - rotated.width) / 2);
          const oy = Math.round((height - rotated.height) / 2);
          ctx.drawImage(rotated, ox, oy);
        }
        buffersRef.current.set(activeLayerId, next);
      }
      paint();
      setStatus(clockwise ? 'Rotated 90° CW' : 'Rotated 90° CCW');
    },
    [getActiveRasterCanvas, pushHistory, paint, layers.length, activeLayerId, activeLayer, width, height]
  );

  const applyCrop = useCallback((area?: PhotoSelection) => {
    const cropArea = area ?? cropDraft;
    if (!cropArea || cropArea.w < 1 || cropArea.h < 1) {
      setStatus('Create a selection before cropping');
      return;
    }
    pushHistory('Crop');
    const x = Math.max(0, Math.floor(cropArea.x));
    const y = Math.max(0, Math.floor(cropArea.y));
    const right = Math.min(width, Math.ceil(cropArea.x + cropArea.w));
    const bottom = Math.min(height, Math.ceil(cropArea.y + cropArea.h));
    const w = Math.max(1, right - x);
    const h = Math.max(1, bottom - y);
    for (const layer of layers) {
      if (layer.kind !== 'raster') continue;
      const src = buffersRef.current.get(layer.id);
      if (src) {
        const next = createLayerCanvas(w, h);
        const ctx = next.getContext('2d');
        if (ctx) ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
        buffersRef.current.set(layer.id, next);
      }
      if (layer.hasMask) {
        const srcMask = masksRef.current.get(layer.id);
        if (srcMask) {
          const next = createLayerCanvas(w, h);
          const ctx = next.getContext('2d');
          if (ctx) ctx.drawImage(srcMask, x, y, w, h, 0, 0, w, h);
          masksRef.current.set(layer.id, next);
        }
      }
    }
    setLayers(prev => prev.map(layer =>
      layer.kind === 'text' && layer.text
        ? {...layer, text: {...layer.text, x: layer.text.x - x, y: layer.text.y - y}}
        : layer
    ));
    setWidth(w);
    setHeight(h);
    setCropDraft(null);
    setSelection(null);
    setStatus(`Cropped to ${w} × ${h}`);
  }, [cropDraft, pushHistory, layers, width, height]);

  const commitZoomInput = useCallback((raw: string) => {
    const pct = Number(raw);
    if (Number.isFinite(pct) && pct > 0) setZoom(clampZoom(pct / 100));
    setZoomInputDraft(null);
  }, []);

  const fitZoom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !hasDoc) return;
    setZoom(calculateFitZoom(viewport.clientWidth, viewport.clientHeight, width, height));
    setPan({x: 0, y: 0});
  }, [hasDoc, width, height]);

  const closeMenu = () => setMenuOpen(null);
  const closeContext = () => setContextMenu(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!hasDoc) return;
    closeContext();
    if (e.button === 2) return;
    const pt = getDocPoint(e.clientX, e.clientY);
    const snappedPt = snapDocPoint(pt);
    setCursor({x: Math.round(pt.x), y: Math.round(pt.y)});
    const currentTool = spacePanRef.current ? 'hand' : tool;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (transform) {
      const handle = hitTransformHandle(pt, transform);
      if (!handle) return;
      drawingRef.current = {
        lastX: snappedPt.x,
        lastY: snappedPt.y,
        mode: 'transform',
        startX: snappedPt.x,
        startY: snappedPt.y,
        handle,
        startBox: {x: transform.x, y: transform.y, w: transform.w, h: transform.h}
      };
      return;
    }

    if (currentTool === 'hand') {
      drawingRef.current = {lastX: e.clientX, lastY: e.clientY, mode: 'pan', startX: pt.x, startY: pt.y};
      return;
    }
    if (currentTool === 'zoom') {
      setZoom(z => stepZoomLevel(z, e.altKey ? -1 : 1));
      return;
    }
    if (currentTool === 'transform') {
      beginTransform();
      return;
    }
    if (currentTool === 'eyedropper') {
      const composed = compositeLayers(width, height, layerInputs());
      const ctx = composed.getContext('2d');
      if (ctx) {
        const x = Math.max(0, Math.min(width - 1, Math.floor(pt.x)));
        const y = Math.max(0, Math.min(height - 1, Math.floor(pt.y)));
        const d = ctx.getImageData(x, y, 1, 1).data;
        const color = rgbaToHex(d[0], d[1], d[2]);
        if (e.altKey) setBg(color);
        else setFg(color);
        setStatus(color);
      }
      return;
    }
    if (currentTool === 'text') {
      if (textEditing) commitTextEditing();
      const hitTextLayer = [...layers].reverse().find(layer => {
        if (layer.kind !== 'text' || !layer.text || !layer.visible || layer.locked) return false;
        const bounds = getTextLayerBounds(layer.text);
        const padding = Math.max(4, layer.text.fontSize * 0.15);
        return pt.x >= bounds.x - padding
          && pt.x <= bounds.x + bounds.w + padding
          && pt.y >= bounds.y - padding
          && pt.y <= bounds.y + bounds.h + padding;
      });
      if (hitTextLayer) {
        startTextEditing(hitTextLayer);
        setStatus(`Editing text: ${hitTextLayer.name}`);
        return;
      }
      pushHistory('New Text Layer');
      const layer = createTextLayer(Math.round(snappedPt.x), Math.round(snappedPt.y), fg, {
        fontFamily: textFontFamily,
        fontSize: textFontSize,
        fontWeight: textFontWeight,
        fontStyle: textFontStyle,
        align: textAlign,
        tracking: textTracking,
        lineHeight: textLineHeight,
        underline: textUnderline,
        strokeWidth: textStrokeWidth,
        strokeColor: textStrokeColor
      });
      setLayers(prev => [...prev, layer]);
      startTextEditing(layer, true);
      return;
    }
    if (currentTool === 'pen') {
      if (penPath && penPath.length) {
        const first = penPath[0];
        const closeDist = Math.max(4, 6 / zoom);
        if (penPath.length >= 2 && Math.hypot(pt.x - first.x, pt.y - first.y) <= closeDist) {
          finishPenPath(true);
          return;
        }
        const anchorIndex = penPath.length;
        setPenPath(prev => (prev ? [...prev, {x: snappedPt.x, y: snappedPt.y, handle: null}] : prev));
        drawingRef.current = {lastX: pt.x, lastY: pt.y, mode: 'pen', startX: pt.x, startY: pt.y, anchorIndex};
        return;
      }
      setPenPath([{x: snappedPt.x, y: snappedPt.y, handle: null}]);
      drawingRef.current = {lastX: pt.x, lastY: pt.y, mode: 'pen', startX: pt.x, startY: pt.y, anchorIndex: 0};
      setStatus('Pen: click to add points · drag for a curve · Enter/double-click to finish · Esc to cancel');
      return;
    }
    if (currentTool === 'fill') {
      const canvas = getPaintTarget();
      if (!canvas) return;
      const fillMask = selection ? (selectionMaskRef.current ?? selectionToMask(selection, width, height)) : null;
      pushHistory('Fill');
      setIsFilling(true);
      floodFill(canvas, pt.x, pt.y, editTarget === 'mask' ? (e.altKey ? '#000000' : '#ffffff') : fg, 24, fillMask, editTarget === 'mask' ? 255 : Math.round(fgAlpha / 100 * 255));
      paint();
      requestAnimationFrame(() => requestAnimationFrame(() => setIsFilling(false)));
      return;
    }
    if (currentTool === 'select') {
      drawingRef.current = {lastX: snappedPt.x, lastY: snappedPt.y, mode: 'select', startX: snappedPt.x, startY: snappedPt.y};
      setDraftSel({shape: 'rect', x: snappedPt.x, y: snappedPt.y, w: 0, h: 0});
      return;
    }
    if (currentTool === 'ellipse') {
      drawingRef.current = {lastX: snappedPt.x, lastY: snappedPt.y, mode: 'ellipse', startX: snappedPt.x, startY: snappedPt.y};
      setDraftSel({shape: 'ellipse', x: snappedPt.x, y: snappedPt.y, w: 0, h: 0});
      return;
    }
    if (currentTool === 'shape') {
      if (!getPaintTarget()) return;
      drawingRef.current = {lastX: snappedPt.x, lastY: snappedPt.y, mode: 'shape', startX: snappedPt.x, startY: snappedPt.y};
      setDraftSel({shape: shapeMode === 'rounded' ? 'rect' : shapeMode, x: snappedPt.x, y: snappedPt.y, w: 0, h: 0});
      return;
    }
    if (currentTool === 'lasso') {
      const points = [{x: pt.x, y: pt.y}];
      drawingRef.current = {
        lastX: pt.x,
        lastY: pt.y,
        mode: 'lasso',
        startX: pt.x,
        startY: pt.y,
        lassoPoints: points
      };
      setDraftSel({shape: 'lasso', x: pt.x, y: pt.y, w: 0, h: 0, points});
      return;
    }
    if (currentTool === 'wand') {
      const source =
        activeLayer?.kind === 'raster'
          ? buffersRef.current.get(activeLayerId)
          : compositeLayers(width, height, layerInputs());
      if (source) {
        const bounds = magicWandBounds(source, pt.x, pt.y);
        if (bounds) {
          setSelection(bounds);
          setStatus(`Wand: ${bounds.w} × ${bounds.h}`);
        } else setStatus('No selection');
      }
      return;
    }
    if (currentTool === 'gradient') {
      drawingRef.current = {lastX: pt.x, lastY: pt.y, mode: 'gradient', startX: pt.x, startY: pt.y};
      return;
    }
    if (currentTool === 'clone') {
      if (e.altKey) {
        cloneSourceRef.current = {x: pt.x, y: pt.y};
        setStatus(`Clone source: ${Math.round(pt.x)}, ${Math.round(pt.y)}`);
        return;
      }
      const canvas = getPaintTarget();
      const sourceCanvas = activeLayer?.kind === 'raster' ? buffersRef.current.get(activeLayerId) : null;
      if (!canvas || !sourceCanvas || !cloneSourceRef.current) {
        setStatus('Alt+click to set clone source');
        return;
      }
      pushHistory('Clone');
      const offsetX = cloneSourceRef.current.x - pt.x;
      const offsetY = cloneSourceRef.current.y - pt.y;
      drawingRef.current = {
        lastX: pt.x,
        lastY: pt.y,
        mode: 'clone',
        startX: pt.x,
        startY: pt.y,
        cloneOffsetX: offsetX,
        cloneOffsetY: offsetY
      };
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCloneStroke(ctx, sourceCanvas, pt.x, pt.y, pt.x, pt.y, brushSize, offsetX, offsetY, brushHardness, brushOpacity / 100);
        paint();
      }
      return;
    }
    if (currentTool === 'crop') {
      drawingRef.current = {lastX: snappedPt.x, lastY: snappedPt.y, mode: 'crop', startX: snappedPt.x, startY: snappedPt.y};
      setCropDraft({shape: 'rect', x: snappedPt.x, y: snappedPt.y, w: 0, h: 0});
      return;
    }
    if (currentTool === 'move') {
      if (activeLayer?.kind === 'text' && activeLayer.text && !activeLayer.locked) {
        drawingRef.current = {
          lastX: pt.x,
          lastY: pt.y,
          mode: 'text-move',
          startX: pt.x,
          startY: pt.y,
          startBox: {x: activeLayer.text.x, y: activeLayer.text.y, w: 0, h: 0}
        };
        pushHistory('Move Text');
        return;
      }
      const canvas = buffersRef.current.get(activeLayerId);
      if (!canvas || activeLayer?.locked || activeLayer?.kind !== 'raster') return;
      moveSourceRef.current = cloneCanvas(canvas);
      const mask = activeLayer.hasMask && activeLayer.maskLinked ? masksRef.current.get(activeLayerId) : null;
      moveMaskSourceRef.current = mask ? cloneCanvas(mask) : null;
      drawingRef.current = {
        lastX: pt.x,
        lastY: pt.y,
        mode: 'move',
        startX: pt.x,
        startY: pt.y,
        selectionStart: selection ? {...selection, points: selection.points?.map(point => ({...point}))} : null
      };
      pushHistory('Move');
      return;
    }
    if (currentTool === 'brush' || currentTool === 'eraser') {
      const canvas = getPaintTarget();
      if (!canvas) return;
      pushHistory(currentTool === 'eraser' ? 'Eraser' : editTarget === 'mask' ? 'Mask Paint' : 'Brush');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawingRef.current = {
        lastX: pt.x,
        lastY: pt.y,
        mode: currentTool === 'eraser' ? 'erase' : 'draw',
        startX: pt.x,
        startY: pt.y
      };
      const color = editTarget === 'mask' ? (currentTool === 'eraser' ? '#000000' : fg) : fg;
      const erase = editTarget === 'mask' ? false : currentTool === 'eraser';
      // On mask, eraser paints black
      const maskEraseAsBlack = editTarget === 'mask' && currentTool === 'eraser';
      const paintAlpha = erase ? 1 : fgAlpha / 100;
      drawBrushStroke(
        ctx,
        pt.x,
        pt.y,
        pt.x,
        pt.y,
        brushSize,
        maskEraseAsBlack ? '#000000' : color,
        erase,
        brushHardness,
        brushOpacity / 100 * paintAlpha
      );
      paint();
      return;
    }
    if (currentTool === 'blurTool' || currentTool === 'sharpenTool' || currentTool === 'dodge' || currentTool === 'burn') {
      if (editTarget === 'mask' || activeLayer?.kind !== 'raster' || activeLayer.locked) {
        setStatus(editTarget === 'mask' ? 'Retouch tools cannot edit masks' : 'Select an unlocked raster layer');
        return;
      }
      const canvas = buffersRef.current.get(activeLayer.id);
      if (!canvas) return;
      pushHistory(currentTool === 'blurTool' ? 'Blur Stroke' : currentTool === 'sharpenTool' ? 'Sharpen Stroke' : currentTool === 'dodge' ? 'Dodge Stroke' : 'Burn Stroke');
      drawingRef.current = {lastX: pt.x, lastY: pt.y, mode: currentTool, startX: pt.x, startY: pt.y};
      applyRetouchStamp(canvas, pt.x, pt.y, currentTool, {size: brushSize, hardness: brushHardness, strength: retouchStrength});
      paint();
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!hasDoc) return;
    const pt = getDocPoint(e.clientX, e.clientY);
    const snappedPt = snapDocPoint(pt);
    setCursor({x: Math.round(pt.x), y: Math.round(pt.y)});
    if (tool === 'pen' && penPath) setPenHover(pt);
    const drag = drawingRef.current;
    if (!drag) return;

    if (drag.mode === 'pen' && typeof drag.anchorIndex === 'number') {
      const anchorIndex = drag.anchorIndex;
      setPenPath(prev => {
        if (!prev) return prev;
        const next = [...prev];
        next[anchorIndex] = {...next[anchorIndex], handle: {x: pt.x, y: pt.y}};
        return next;
      });
      return;
    }
    if (drag.mode === 'pan') {
      setPan(p => ({x: p.x + (e.clientX - drag.lastX), y: p.y + (e.clientY - drag.lastY)}));
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      return;
    }
    if (drag.mode === 'transform' && drag.startBox && drag.handle) {
      const dx = snappedPt.x - drag.startX;
      const dy = snappedPt.y - drag.startY;
      let {x, y, w, h} = drag.startBox;
      const handle = drag.handle;
      if (handle === 'move') {
        x += dx;
        y += dy;
      } else {
        if (handle.includes('e')) w = Math.max(1, drag.startBox.w + dx);
        if (handle.includes('s')) h = Math.max(1, drag.startBox.h + dy);
        if (handle.includes('w')) {
          w = Math.max(1, drag.startBox.w - dx);
          x = drag.startBox.x + dx;
        }
        if (handle.includes('n')) {
          h = Math.max(1, drag.startBox.h - dy);
          y = drag.startBox.y + dy;
        }
      }
      const nextBox = snapEnabled ? snapBox({x, y, w, h}, {guides, gridSize, zoom}, handle === 'move' ? 'move' : 'resize') : {x, y, w, h};
      setTransform(t => (t ? {...t, ...nextBox} : t));
      return;
    }
    if (drag.mode === 'select' || drag.mode === 'ellipse' || drag.mode === 'crop' || drag.mode === 'shape') {
      const shape = drag.mode === 'ellipse' ? 'ellipse' : drag.mode === 'shape' ? shapeMode : 'rect';
      const selectionShape = shape === 'rounded' ? 'rect' : shape;
      const rect = rectFromDrag(drag.startX, drag.startY, snappedPt.x, snappedPt.y, width, height, selectionShape);
      if (drag.mode === 'select' || drag.mode === 'ellipse') setDraftSel(rect);
      else if (drag.mode === 'shape') setDraftSel(rect);
      else setCropDraft(rect);
      return;
    }
    if (drag.mode === 'lasso' && drag.lassoPoints) {
      const last = drag.lassoPoints[drag.lassoPoints.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) >= 2) {
        drag.lassoPoints.push({x: pt.x, y: pt.y});
        const bounds = boundsFromPoints(drag.lassoPoints);
        setDraftSel({
          shape: 'lasso',
          ...bounds,
          points: [...drag.lassoPoints]
        });
      }
      return;
    }
    if (drag.mode === 'move') {
      const source = moveSourceRef.current;
      if (!source || activeLayer?.locked || activeLayer?.kind !== 'raster') return;
      let dx = Math.round(pt.x - drag.startX);
      let dy = Math.round(pt.y - drag.startY);
      if (snapEnabled) {
        const bounds = getOpaqueBounds(source) ?? {x: 0, y: 0, w: width, h: height};
        const snapped = snapBox({...bounds, x: bounds.x + dx, y: bounds.y + dy}, {guides, gridSize, zoom});
        dx = Math.round(snapped.x - bounds.x);
        dy = Math.round(snapped.y - bounds.y);
      }
      const next = createLayerCanvas(width, height);
      const ctx = next.getContext('2d');
      if (ctx) ctx.drawImage(source, dx, dy);
      buffersRef.current.set(activeLayerId, next);
      if (activeLayer.hasMask && activeLayer.maskLinked) {
        const maskSource = moveMaskSourceRef.current;
        if (maskSource) {
          const nm = createLayerCanvas(width, height);
          const mctx = nm.getContext('2d');
          if (mctx) mctx.drawImage(maskSource, dx, dy);
          masksRef.current.set(activeLayerId, nm);
        }
      }
      drag.lastX = pt.x;
      drag.lastY = pt.y;
      if (drag.selectionStart) {
        setSelection({
          ...drag.selectionStart,
          x: drag.selectionStart.x + dx,
          y: drag.selectionStart.y + dy,
          points: drag.selectionStart.points?.map(point => ({x: point.x + dx, y: point.y + dy}))
        });
      }
      paint();
      return;
    }
    if (drag.mode === 'text-move' && drag.startBox && activeLayer?.kind === 'text' && !activeLayer.locked) {
      const next = snapDocPoint({
        x: drag.startBox.x + pt.x - drag.startX,
        y: drag.startBox.y + pt.y - drag.startY
      });
      updateTextLayer(activeLayer.id, {
        x: Math.round(next.x),
        y: Math.round(next.y)
      });
      return;
    }
    if (drag.mode === 'blurTool' || drag.mode === 'sharpenTool' || drag.mode === 'dodge' || drag.mode === 'burn') {
      const canvas = activeLayer?.kind === 'raster' ? buffersRef.current.get(activeLayer.id) : null;
      if (!canvas || !activeLayer || activeLayer.locked || editTarget === 'mask') return;
      applyRetouchStroke(canvas, drag.lastX, drag.lastY, pt.x, pt.y, drag.mode as RetouchMode, {
        size: brushSize, hardness: brushHardness, strength: retouchStrength
      });
      drag.lastX = pt.x; drag.lastY = pt.y; paint();
      return;
    }
    if (drag.mode === 'draw' || drag.mode === 'erase') {
      const canvas = getPaintTarget();
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const maskEraseAsBlack = editTarget === 'mask' && drag.mode === 'erase';
      const erase = editTarget === 'mask' ? false : drag.mode === 'erase';
      const color = maskEraseAsBlack ? '#000000' : editTarget === 'mask' ? fg : fg;
      drawBrushStroke(ctx, drag.lastX, drag.lastY, pt.x, pt.y, brushSize, color, erase, brushHardness, brushOpacity / 100 * (erase ? 1 : fgAlpha / 100));
      drag.lastX = pt.x;
      drag.lastY = pt.y;
      paint();
      return;
    }
    if (drag.mode === 'clone' && drag.cloneOffsetX !== undefined && drag.cloneOffsetY !== undefined) {
      const canvas = getPaintTarget();
      const sourceCanvas = activeLayer?.kind === 'raster' ? buffersRef.current.get(activeLayerId) : null;
      if (!canvas || !sourceCanvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawCloneStroke(
        ctx,
        sourceCanvas,
        drag.lastX,
        drag.lastY,
        pt.x,
        pt.y,
        brushSize,
        drag.cloneOffsetX,
        drag.cloneOffsetY,
        brushHardness,
        brushOpacity / 100
      );
      drag.lastX = pt.x;
      drag.lastY = pt.y;
      paint();
    }
  };

  const onPointerUp = (e?: ReactPointerEvent) => {
    const drag = drawingRef.current;
    if (drag?.mode === 'select' || drag?.mode === 'ellipse') {
      selectionMaskRef.current = null;
      if (draftSel && draftSel.w >= 1 && draftSel.h >= 1) setSelection(draftSel);
      else setSelection(null);
      setDraftSel(null);
    }
    if (drag?.mode === 'shape') {
      const canvas = getPaintTarget();
      if (canvas && draftSel && draftSel.w >= 1 && draftSel.h >= 1) {
        pushHistory('Shape');
        drawShape(canvas, draftSel.x, draftSel.y, draftSel.w, draftSel.h, shapeMode, shapeStyle, fg, bg, shapeStrokeWidth, fgAlpha / 100, bgAlpha / 100);
        paint();
      }
      setDraftSel(null);
    }
    if (drag?.mode === 'lasso' && drag.lassoPoints && drag.lassoPoints.length > 2) {
      selectionMaskRef.current = null;
      const bounds = boundsFromPoints(drag.lassoPoints);
      setSelection({
        shape: 'lasso',
        ...bounds,
        points: [...drag.lassoPoints]
      });
      setDraftSel(null);
    } else if (drag?.mode === 'lasso') {
      setDraftSel(null);
    }
    if (drag?.mode === 'gradient' && e) {
      const pt = getDocPoint(e.clientX, e.clientY);
      const canvas = getPaintTarget();
      if (canvas) {
        const gradientMask = selection ? (selectionMaskRef.current ?? selectionToMask(selection, width, height)) : null;
        pushHistory('Gradient');
        drawLinearGradient(canvas, drag.startX, drag.startY, pt.x, pt.y, fg, bg, selection, gradientMask, fgAlpha / 100, bgAlpha / 100);
        paint();
      }
    }
    if (drag?.mode === 'move') {
      moveSourceRef.current = null;
      moveMaskSourceRef.current = null;
    }
    drawingRef.current = null;
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasDoc) return;
    setContextMenu({x: e.clientX, y: e.clientY, target: 'canvas'});
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltPressed(true);

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spacePanRef.current = true;
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 't') {
        e.preventDefault();
        beginTransform();
        return;
      }
      if (mod && e.shiftKey && key === 'n') {
        e.preventDefault();
        addLayer();
        return;
      }
      if (mod && key === 'n') {
        e.preventDefault();
        setNewDialog(true);
        return;
      }
      if (mod && key === 'j') {
        e.preventDefault();
        duplicateLayer();
        return;
      }
      if (mod && key === 'r') {
        e.preventDefault();
        setShowRulers(value => !value);
        return;
      }
      if (mod && (e.key === "'" || e.code === 'Quote')) {
        e.preventDefault();
        setShowGrid(value => !value);
        return;
      }
      if (mod && key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }
      if (mod && key === 's') {
        e.preventDefault();
        if (e.shiftKey) void saveAs('image/png');
        else void saveProject();
        return;
      }
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((mod && key === 'z' && e.shiftKey) || (mod && key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        deselect();
        return;
      }
      if (mod && e.shiftKey && key === 'i') {
        e.preventDefault();
        invertSelection();
        return;
      }
      if (mod && key === 'c') {
        e.preventDefault();
        copySelection();
        return;
      }
      if (mod && key === 'x') {
        e.preventDefault();
        cutSelection();
        return;
      }
      if (mod && key === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if (mod && (key === '=' || key === '+')) {
        e.preventDefault();
        setZoom(z => stepZoomLevel(z, 1));
        return;
      }
      if (mod && key === '-') {
        e.preventDefault();
        setZoom(z => stepZoomLevel(z, -1));
        return;
      }
      if (mod && key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({x: 0, y: 0});
        return;
      }
      if (mod && key === '1') {
        e.preventDefault();
        fitZoom();
        return;
      }

      if (e.key === 'Escape') {
        if (transform) cancelTransform();
        else if (penPath) cancelPenPath();
        else if (cropDraft) setCropDraft(null);
        else if (textEditing) cancelTextEditing();
        else if (contextMenu) closeContext();
        else if (menuOpen) closeMenu();
        else deselect();
        return;
      }
      if (e.key === 'Enter') {
        if (penPath) {
          e.preventDefault();
          finishPenPath(false);
          return;
        }
        if (transform) {
          e.preventDefault();
          applyTransform();
          return;
        }
        if (cropDraft) {
          e.preventDefault();
          applyCrop();
          return;
        }
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (e.shiftKey) copyLayerStyle();
        else pasteLayerStyle();
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        addLayer();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        deleteLayer();
        return;
      }
      if (e.key === 'F5') {
        e.preventDefault();
        applyCrop(selection ?? undefined);
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        flipActiveLayer(true);
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        flipActiveLayer(false);
        return;
      }
      if (e.key === 'F12') {
        if (selection) {
          e.preventDefault();
          deselect();
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && hasDoc) {
        e.preventDefault();
        if (activeLayer?.kind === 'text') deleteLayer();
        else clearSelectionContent();
        return;
      }
      if (tool === 'move' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const amount = e.shiftKey ? 10 : 1;
        nudgeActiveLayer(
          e.key === 'ArrowLeft' ? -amount : e.key === 'ArrowRight' ? amount : 0,
          e.key === 'ArrowUp' ? -amount : e.key === 'ArrowDown' ? amount : 0
        );
        return;
      }
      if (key === 'x' && !mod) {
        setFg(bg);
        setBg(fg);
        return;
      }
      if (key === 'd' && !mod) {
        setFg(DEFAULT_FG);
        setBg(DEFAULT_BG);
        return;
      }
      if (e.key === '[') {
        setBrushSize(s => Math.max(1, s - (e.shiftKey ? 10 : 1)));
        return;
      }
      if (e.key === ']') {
        setBrushSize(s => Math.min(500, s + (e.shiftKey ? 10 : 1)));
        return;
      }
      if (!mod && e.shiftKey && key === 'o') {
        setTool(current => current === 'dodge' ? 'burn' : 'dodge');
        return;
      }
      if (!mod && !e.altKey && !e.shiftKey && /^[0-9]$/.test(e.key) && activeLayerId) {
        const opacity = e.key === '0' ? 1 : Number(e.key) / 10;
        setLayers(prev => prev.map(layer => layer.id === activeLayerId ? {...layer, opacity} : layer));
        pushHistory(`Opacity ${Math.round(opacity * 100)}%`);
        return;
      }
      if (!mod && TOOL_SHORTCUTS[key]) setTool(TOOL_SHORTCUTS[key]);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spacePanRef.current = false;
      if (e.key === 'Alt') setAltPressed(false);
    };
    const onBlur = () => setAltPressed(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    saveAs,
    saveProject,
    undo,
    redo,
    selectAll,
    deselect,
    copySelection,
    cutSelection,
    pasteClipboard,
    fitZoom,
    cropDraft,
    selection,
    textEditing,
    contextMenu,
    menuOpen,
    applyCrop,
    hasDoc,
    clearSelectionContent,
    fg,
    bg,
    beginTransform,
    transform,
    cancelTransform,
    applyTransform,
    activeLayerId,
    pushHistory,
    invertSelection,
    activeLayer,
    deleteLayer,
    copyLayerStyle,
    pasteLayerStyle,
    flipActiveLayer,
    cancelTextEditing,
    addLayer,
    duplicateLayer,
    tool,
    nudgeActiveLayer,
    penPath,
    finishPenPath,
    cancelPenPath
  ]);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      void openFiles(e.dataTransfer.files);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [openFiles]);

  // Keep the browser page itself from zooming (Ctrl+wheel, or a trackpad pinch, which browsers
  // report as a wheel event with ctrlKey set) while the photo editor is open - the in-app Zoom
  // tool and mouse wheel over the canvas already handle zoom, and .photo-viewport's own onWheel
  // preventDefault only covers gestures made over the canvas itself, not the rest of the app.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, {passive: false});
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const menuItems: Record<
    Exclude<MenuKey, null>,
    {label: string; shortcut?: string; action: () => void; disabled?: boolean}[]
  > = {
    file: [
      {label: 'New…', shortcut: 'Ctrl+N', action: () => setNewDialog(true)},
      {label: 'Open…', shortcut: 'Ctrl+O', action: () => fileInputRef.current?.click()},
      {label: 'Save Project (.kphoto)', shortcut: 'Ctrl+S', action: () => void saveProject(), disabled: !hasDoc},
      {label: 'Export as PNG', shortcut: 'Ctrl+Shift+S', action: () => void saveAs('image/png'), disabled: !hasDoc},
      {label: 'Export as JPG', action: () => void saveAs('image/jpeg'), disabled: !hasDoc},
      {
        label: 'Close',
        action: () => {
          setHasDoc(false);
          setLayers([]);
          buffersRef.current.clear();
          masksRef.current.clear();
          historyRef.current = [];
          setSelection(null);
          setTransform(null);
          setStatus('Closed');
        },
        disabled: !hasDoc
      }
    ],
    edit: [
      {label: 'Undo', shortcut: 'Ctrl+Z', action: undo, disabled: historyIndex <= 0},
      {label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: redo, disabled: historyIndex >= historyEntries.length - 1},
      {label: 'Free Transform', shortcut: 'Ctrl+T', action: beginTransform, disabled: !hasDoc || activeLayer?.kind !== 'raster'},
      {label: 'Cut', shortcut: 'Ctrl+X', action: cutSelection, disabled: !hasDoc},
      {label: 'Copy', shortcut: 'Ctrl+C', action: copySelection, disabled: !hasDoc},
      {label: 'Paste', shortcut: 'Ctrl+V', action: pasteClipboard, disabled: !clipboardRef.current},
      {label: 'Clear', shortcut: 'Del', action: clearSelectionContent, disabled: !hasDoc},
      {label: 'Fill', action: fillSelection, disabled: !hasDoc},
      {
        label: 'Stroke Selection…',
        action: () => {
          if (!hasDoc || !selection) return;
          const canvas = getPaintTarget();
          if (!canvas) return;
          const widthInput = window.prompt('Stroke width (px)', '3');
          if (widthInput === null) return;
          const strokeWidth = Number(widthInput);
          if (!Number.isFinite(strokeWidth) || strokeWidth <= 0) return;
          const locationInput = (window.prompt('Location: inside / center / outside', 'center') ?? 'center').trim().toLowerCase();
          const location = locationInput === 'inside' || locationInput === 'outside' ? locationInput : 'center';
          pushHistory('Stroke Selection');
          strokeSelectionArea(canvas, selection, strokeWidth, fg, location as 'inside' | 'center' | 'outside', fgAlpha / 100);
          paint();
        },
        disabled: !hasDoc || !selection
      }
    ],
    image: [
      {
        label: 'Image Size…',
        action: () => {
          if (!hasDoc) return;
          const nw = Number(window.prompt('Width (px)', String(width)));
          const nh = Number(window.prompt('Height (px)', String(height)));
          if (!Number.isFinite(nw) || !Number.isFinite(nh) || nw < 1 || nh < 1) return;
          pushHistory('Image Size');
          for (const layer of layers) {
            if (layer.kind !== 'raster') continue;
            const src = buffersRef.current.get(layer.id);
            if (src) {
              const next = createLayerCanvas(nw, nh);
              const ctx = next.getContext('2d');
              if (ctx) ctx.drawImage(src, 0, 0, nw, nh);
              buffersRef.current.set(layer.id, next);
            }
            if (layer.hasMask) {
              const srcMask = masksRef.current.get(layer.id);
              if (srcMask) {
                const next = createLayerCanvas(nw, nh);
                const ctx = next.getContext('2d');
                if (ctx) ctx.drawImage(srcMask, 0, 0, nw, nh);
                masksRef.current.set(layer.id, next);
              }
            }
          }
          setLayers(prev => prev.map(layer =>
            layer.kind === 'text' && layer.text
              ? {...layer, text: {
                  ...layer.text,
                  x: layer.text.x * nw / width,
                  y: layer.text.y * nh / height,
                  fontSize: layer.text.fontSize * Math.min(nw / width, nh / height)
                }}
              : layer
          ));
          setWidth(Math.round(nw));
          setHeight(Math.round(nh));
          deselect();
        },
        disabled: !hasDoc
      },
      {
        label: 'Canvas Size…',
        action: () => {
          if (!hasDoc) return;
          const nw = Number(window.prompt('Canvas width (px)', String(width)));
          const nh = Number(window.prompt('Canvas height (px)', String(height)));
          if (!Number.isFinite(nw) || !Number.isFinite(nh) || nw < 1 || nh < 1) return;
          pushHistory('Canvas Size');
          const ox = Math.round((nw - width) / 2);
          const oy = Math.round((nh - height) / 2);
          for (const layer of layers) {
            if (layer.kind !== 'raster') continue;
            const src = buffersRef.current.get(layer.id);
            if (src) {
              const next = createLayerCanvas(nw, nh);
              const ctx = next.getContext('2d');
              if (ctx) ctx.drawImage(src, ox, oy);
              buffersRef.current.set(layer.id, next);
            }
            if (layer.hasMask) {
              const srcMask = masksRef.current.get(layer.id);
              if (srcMask) {
                const next = createLayerCanvas(nw, nh, '#ffffff');
                const ctx = next.getContext('2d');
                if (ctx) ctx.drawImage(srcMask, ox, oy);
                masksRef.current.set(layer.id, next);
              }
            }
          }
          setLayers(prev => prev.map(layer =>
            layer.kind === 'text' && layer.text
              ? {...layer, text: {...layer.text, x: layer.text.x + ox, y: layer.text.y + oy}}
              : layer
          ));
          setWidth(Math.round(nw));
          setHeight(Math.round(nh));
          deselect();
        },
        disabled: !hasDoc
      },
      {
        label: 'Crop to Selection',
        shortcut: 'F5',
        action: () => applyCrop(selection ?? undefined),
        disabled: !hasDoc || !selection
      },
      {
        label: 'Flatten Image',
        action: () => {
          if (!hasDoc || layers.length < 2) return;
          pushHistory('Flatten');
          const flat = compositeLayers(width, height, layerInputs());
          const layer = createRasterLayer('Background');
          const id = layer.id;
          buffersRef.current = new Map([[id, flat]]);
          masksRef.current = new Map();
          setLayers([layer]);
          setActiveLayerId(id);
        },
        disabled: !hasDoc || layers.length < 2
      }
    ],
    filter: [
      {
        label: 'Gaussian Blur',
        action: () => applyFilterToActiveLayer('Gaussian Blur', c => boxBlurCanvas(c, 2)),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Sharpen',
        action: () => applyFilterToActiveLayer('Sharpen', c => sharpenCanvas(c)),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Invert',
        action: () => applyFilterToActiveLayer('Invert', c => invertCanvas(c)),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Desaturate',
        action: () => applyFilterToActiveLayer('Desaturate', c => desaturateCanvas(c)),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Flip Horizontal',
        shortcut: 'F7',
        action: () => flipActiveLayer(true),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Flip Vertical',
        shortcut: 'F8',
        action: () => flipActiveLayer(false),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Rotate 90° CW',
        action: () => applyRotate90(true),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      },
      {
        label: 'Rotate 90° CCW',
        action: () => applyRotate90(false),
        disabled: !hasDoc || activeLayer?.kind !== 'raster'
      }
    ],
    layer: [
      {label: 'New Layer', shortcut: 'F3', action: () => addLayer(), disabled: !hasDoc},
      {label: 'Copy Layer Style', shortcut: 'Shift+F2', action: () => copyLayerStyle(), disabled: !activeLayer || activeLayer.kind === 'adjustment'},
      {label: 'Paste Layer Style', shortcut: 'F2', action: () => pasteLayerStyle(), disabled: !activeLayer || activeLayer.kind === 'adjustment' || !layerStyleClipboardRef.current},
      {label: 'New Adjustment Layer', action: addAdjustmentLayer, disabled: !hasDoc},
      {label: 'New Hue/Saturation Layer', action: addHueSaturationLayer, disabled: !hasDoc},
      {label: 'New Levels Layer', action: addLevelsLayer, disabled: !hasDoc},
      {label: 'Duplicate Layer', shortcut: 'Ctrl+J', action: () => duplicateLayer(), disabled: !hasDoc},
      {label: activeLayer?.locked ? 'Unlock Layer' : 'Lock Layer', action: () => toggleLock(), disabled: !activeLayer},
      {label: 'Bring to Front', action: () => setLayerEdge('front'), disabled: !activeLayer},
      {label: 'Send to Back', action: () => setLayerEdge('back'), disabled: !activeLayer},
      {label: 'Rasterize Text', action: () => rasterizeText(), disabled: activeLayer?.kind !== 'text'},
      {label: 'Delete Layer', shortcut: 'F4', action: () => deleteLayer(), disabled: !hasDoc || layers.length <= 1},
      {label: 'Merge Down', action: mergeDown, disabled: !hasDoc},
      {label: 'Add Layer Mask', action: addMask, disabled: !activeLayer || activeLayer.kind !== 'raster' || activeLayer.hasMask},
      {label: 'Delete Layer Mask', action: deleteMask, disabled: !activeLayer?.hasMask}
    ],
    select: [
      {label: 'All', shortcut: 'Ctrl+A', action: selectAll, disabled: !hasDoc},
      {label: 'Deselect', shortcut: 'Ctrl+D', action: deselect, disabled: !selection},
      {label: 'Inverse', shortcut: 'Ctrl+Shift+I', action: invertSelection, disabled: !selection}
    ],
    view: [
      {label: `${showRulers ? '✓ ' : ''}Show Rulers`, shortcut: 'Ctrl+R', action: () => setShowRulers(value => !value)},
      {label: `${showGrid ? '✓ ' : ''}Show Grid`, shortcut: "Ctrl+'", action: () => setShowGrid(value => !value)},
      {label: `${snapEnabled ? '✓ ' : ''}Snap`, action: () => setSnapEnabled(value => !value)},
      {
        label: 'Grid Size…',
        action: () => {
          const value = Number(window.prompt('Grid size in pixels (5–500)', String(gridSize)));
          if (Number.isFinite(value) && value >= 5 && value <= 500) setGridSize(Math.round(value));
          else if (!Number.isNaN(value)) setStatus('Grid size must be 5–500 px');
        }
      },
      {
        label: 'New Guide…',
        action: () => {
          const orientationInput = window.prompt('Orientation: H (horizontal) or V (vertical)', 'V');
          if (!orientationInput) return;
          const orientation = orientationInput.trim().toLowerCase();
          if (orientation !== 'h' && orientation !== 'horizontal' && orientation !== 'v' && orientation !== 'vertical') {
            setStatus('Guide orientation must be H or V');
            return;
          }
          const position = Number(window.prompt('Guide position in pixels', '0'));
          const horizontal = orientation.startsWith('h');
          const maximum = horizontal ? height : width;
          if (!Number.isFinite(position) || position < 0 || position > maximum) {
            setStatus(`Guide position must be 0–${maximum}px`);
            return;
          }
          setGuides(prev => [...prev, {
            id: `guide-${Date.now()}-${prev.length}`,
            orientation: horizontal ? 'horizontal' : 'vertical',
            position
          }]);
        },
        disabled: !hasDoc
      },
      {label: 'Clear Guides', action: () => setGuides([]), disabled: guides.length === 0},
      {label: 'Zoom In', shortcut: 'Ctrl++', action: () => setZoom(z => stepZoomLevel(z, 1))},
      {label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => setZoom(z => stepZoomLevel(z, -1))},
      {
        label: '100%',
        shortcut: 'Ctrl+0',
        action: () => {
          setZoom(1);
          setPan({x: 0, y: 0});
        }
      },
      {label: 'Fit on Screen', shortcut: 'Ctrl+1', action: fitZoom}
    ]
  };

  const editingTextLayer = textEditing
    ? layers.find(layer => layer.id === textEditing.layerId && layer.kind === 'text')
    : null;
  const textViewOrigin = getViewOrigin();

  return (
    <div
      className="photo-app"
      onClick={() => {
        closeMenu();
        closeContext();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".kphoto,application/x-kaisa-photo,image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
        hidden
        onChange={e => {
          void openFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <PhotoMenubar
        open={menuOpen}
        items={menuItems}
        documentLabel={hasDoc ? `${docName}${dirty ? ' *' : ''} — ${width} × ${height}` : 'No document'}
        onOpenChange={setMenuOpen}
      />

      <div className="photo-doctabs" onClick={e => e.stopPropagation()}>
        {docTabs.map(t => (
          <div
            key={t.id}
            className={`photo-doctabs__tab${t.id === activeDocIdRef.current ? ' is-active' : ''}`}
            onClick={() => switchToDocument(t.id)}
            title={t.name}
          >
            <span className="photo-doctabs__name">{t.name}{t.dirty ? ' *' : ''}</span>
            <button
              type="button"
              className="photo-doctabs__close"
              title="Close"
              onClick={e => {
                e.stopPropagation();
                closeDocument(t.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <PhotoOptionsBar>
        <span className="photo-options__tool">{tool.toUpperCase()}</span>
        {(tool === 'brush' || tool === 'eraser' || tool === 'clone' || tool === 'blurTool' || tool === 'sharpenTool' || tool === 'dodge' || tool === 'burn') && (
          <>
            <label className="photo-options__field">
              Size
              <input type="range" min={1} max={200} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} />
              <span>{brushSize}px</span>
            </label>
            <label className="photo-options__field">
              Hardness
              <input
                type="range"
                min={0}
                max={100}
                value={brushHardness}
                onChange={e => setBrushHardness(Number(e.target.value))}
              />
              <span>{brushHardness}%</span>
            </label>
            {tool === 'blurTool' || tool === 'sharpenTool' || tool === 'dodge' || tool === 'burn' ? (
              <label className="photo-options__field">
                {tool === 'dodge' || tool === 'burn' ? 'Exposure' : 'Strength'}
                <input type="range" min={1} max={100} value={retouchStrength} onChange={e => setRetouchStrength(Number(e.target.value))} />
                <span>{retouchStrength}%</span>
              </label>
            ) : (
              <label className="photo-options__field">
                Opacity
                <input type="range" min={1} max={100} value={brushOpacity} onChange={e => setBrushOpacity(Number(e.target.value))} />
                <span>{brushOpacity}%</span>
              </label>
            )}
          </>
        )}
        {tool === 'shape' && (
          <>
            <label className="photo-options__field">Shape
              <select className="photo-options__select" value={shapeMode} onChange={e => setShapeMode(e.target.value as ShapeMode)}>
                <option value="rect">Rectangle</option>
                <option value="ellipse">Ellipse</option>
                <option value="rounded">Rounded Rectangle</option>
              </select>
            </label>
            <label className="photo-options__field">Mode
              <select className="photo-options__select" value={shapeStyle} onChange={e => setShapeStyle(e.target.value as ShapeStyle)}>
                <option value="fill">Fill</option><option value="stroke">Stroke</option><option value="both">Both</option>
              </select>
            </label>
            {shapeStyle !== 'fill' && <label className="photo-options__field">Stroke
              <input type="range" min={1} max={50} value={shapeStrokeWidth} onChange={e => setShapeStrokeWidth(Number(e.target.value))} />
              <span>{shapeStrokeWidth}px</span>
            </label>}
          </>
        )}
        {tool === 'pen' && (
          <>
            <label className="photo-options__field">Mode
              <select className="photo-options__select" value={shapeStyle} onChange={e => setShapeStyle(e.target.value as ShapeStyle)}>
                <option value="fill">Fill</option><option value="stroke">Stroke</option><option value="both">Both</option>
              </select>
            </label>
            {shapeStyle !== 'fill' && <label className="photo-options__field">Stroke
              <input type="range" min={1} max={50} value={shapeStrokeWidth} onChange={e => setShapeStrokeWidth(Number(e.target.value))} />
              <span>{shapeStrokeWidth}px</span>
            </label>}
            {penPath && <span className="photo-options__badge">{penPath.length} point{penPath.length === 1 ? '' : 's'}</span>}
          </>
        )}
        {(tool === 'text' || activeLayer?.kind === 'text') && (
          <>
            <label className="photo-options__field">Font
              <select className="photo-options__select" value={activeLayer?.kind === 'text' ? activeLayer.text?.fontFamily : textFontFamily}
                onChange={e => {
                  const fontFamily = e.target.value;
                  if (activeLayer?.kind === 'text') { pushHistory('Text Font'); updateTextLayer(activeLayer.id, {fontFamily}); }
                  setTextFontFamily(fontFamily);
                }}>
                {['Arial', 'sans-serif', 'serif', 'monospace', 'Malgun Gothic'].map(font => <option key={font} value={font}>{font}</option>)}
              </select>
            </label>
            <label className="photo-options__field">Size
              <input className="photo-options__select" type="number" min={8} max={400}
                value={activeLayer?.kind === 'text' ? activeLayer.text?.fontSize : textFontSize}
                onFocus={() => activeLayer?.kind === 'text' && pushHistory('Text Size')}
                onChange={e => {
                  const fontSize = Math.max(8, Math.min(400, Number(e.target.value) || 8));
                  if (activeLayer?.kind === 'text') updateTextLayer(activeLayer.id, {fontSize});
                  setTextFontSize(fontSize);
                }} />
            </label>
            <button type="button" className={activeLayer?.text?.fontWeight === 'bold' || (!activeLayer?.text && textFontWeight === 'bold') ? 'is-active' : ''}
              onClick={() => {
                const fontWeight = (activeLayer?.text?.fontWeight ?? textFontWeight) === 'bold' ? 'normal' : 'bold';
                if (activeLayer?.kind === 'text') { pushHistory('Text Bold'); updateTextLayer(activeLayer.id, {fontWeight}); }
                setTextFontWeight(fontWeight);
              }}><b>B</b></button>
            <button type="button" className={activeLayer?.text?.fontStyle === 'italic' || (!activeLayer?.text && textFontStyle === 'italic') ? 'is-active' : ''}
              onClick={() => {
                const fontStyle = (activeLayer?.text?.fontStyle ?? textFontStyle) === 'italic' ? 'normal' : 'italic';
                if (activeLayer?.kind === 'text') { pushHistory('Text Italic'); updateTextLayer(activeLayer.id, {fontStyle}); }
                setTextFontStyle(fontStyle);
              }}><i>I</i></button>
            <label className="photo-options__field">Align
              <select className="photo-options__select" value={activeLayer?.text?.align ?? textAlign}
                onChange={e => {
                  const align = e.target.value as TextLayerData['align'];
                  if (activeLayer?.kind === 'text') { pushHistory('Text Align'); updateTextLayer(activeLayer.id, {align}); }
                  setTextAlign(align);
                }}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </label>
            <label className="photo-options__field">Color
              <input type="color" value={activeLayer?.text?.color ?? fg}
                onFocus={() => activeLayer?.kind === 'text' && pushHistory('Text Color')}
                onChange={e => {
                  const color = e.target.value;
                  if (activeLayer?.kind === 'text') updateTextLayer(activeLayer.id, {color});
                  setFg(color);
                }} />
            </label>
            <label className="photo-options__field">Tracking
              <input className="photo-options__number" type="number" min={-10} max={50}
                value={activeLayer?.text?.tracking ?? textTracking}
                onFocus={() => activeLayer?.kind === 'text' && pushHistory('Text Tracking')}
                onChange={e => {
                  const tracking = Math.max(-10, Math.min(50, Number(e.target.value) || 0));
                  if (activeLayer?.kind === 'text') updateTextLayer(activeLayer.id, {tracking});
                  setTextTracking(tracking);
                }} />
            </label>
            <label className="photo-options__field">Line
              <input className="photo-options__number" type="number" min={0.5} max={3} step={0.1}
                value={activeLayer?.text?.lineHeight ?? textLineHeight}
                onFocus={() => activeLayer?.kind === 'text' && pushHistory('Text Line Height')}
                onChange={e => {
                  const lineHeight = Math.max(.5, Math.min(3, Number(e.target.value) || 1.2));
                  if (activeLayer?.kind === 'text') updateTextLayer(activeLayer.id, {lineHeight});
                  setTextLineHeight(lineHeight);
                }} />
            </label>
            <button type="button" title="Underline"
              className={(activeLayer?.text?.underline ?? textUnderline) ? 'is-active' : ''}
              onClick={() => {
                const underline = !(activeLayer?.text?.underline ?? textUnderline);
                if (activeLayer?.kind === 'text') { pushHistory('Text Underline'); updateTextLayer(activeLayer.id, {underline}); }
                setTextUnderline(underline);
              }}><u>U</u></button>
            <label className="photo-options__field">Outline
              <input className="photo-options__number" type="number" min={0} max={20}
                value={activeLayer?.text?.strokeWidth ?? textStrokeWidth}
                onFocus={() => activeLayer?.kind === 'text' && pushHistory('Text Outline')}
                onChange={e => {
                  const strokeWidth = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                  if (activeLayer?.kind === 'text') updateTextLayer(activeLayer.id, {strokeWidth});
                  setTextStrokeWidth(strokeWidth);
                }} />
              <input type="color" value={activeLayer?.text?.strokeColor ?? textStrokeColor}
                onFocus={() => activeLayer?.kind === 'text' && pushHistory('Text Outline Color')}
                onChange={e => {
                  if (activeLayer?.kind === 'text') updateTextLayer(activeLayer.id, {strokeColor: e.target.value});
                  setTextStrokeColor(e.target.value);
                }} />
            </label>
          </>
        )}
        {transform ? (
          <label className="photo-options__field">
            Rotation
            <input
              type="range"
              min={-180}
              max={180}
              value={transform.rotation}
              onChange={e => setTransform(t => (t ? {...t, rotation: Number(e.target.value)} : t))}
            />
            <span>{transform.rotation}°</span>
          </label>
        ) : null}
        {activeLayer?.kind === 'adjustment' && activeLayer.adjustment === 'levels' && activeLayer.adjustmentParams ? (
          <>
            {([
              ['black', 'Black', 0, 254, 1],
              ['white', 'White', 1, 255, 1],
              ['gamma', 'Gamma', .1, 3, .1]
            ] as const).map(([key, label, min, max, step]) => (
              <label className="photo-options__field" key={key}>{label}
                <input type="range" min={min} max={max} step={step} value={activeLayer.adjustmentParams?.[key] ?? DEFAULT_ADJUSTMENT[key]}
                  onChange={e => {
                    const value = Number(e.target.value);
                    setLayers(prev => prev.map(layer => layer.id === activeLayerId
                      ? {...layer, adjustmentParams: {...(layer.adjustmentParams ?? DEFAULT_ADJUSTMENT), [key]: value}} : layer));
                  }}
                  onPointerUp={() => pushHistory(`Levels ${label}`)}
                />
                <span>{activeLayer.adjustmentParams?.[key] ?? DEFAULT_ADJUSTMENT[key]}</span>
              </label>
            ))}
          </>
        ) : null}
        {activeLayer?.kind === 'adjustment' && activeLayer.adjustment !== 'levels' && activeLayer.adjustmentParams ? (
          activeLayer.adjustment === 'hueSaturation' ? (
            <>
              <label className="photo-options__field">
                Hue
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={activeLayer.adjustmentParams.hue}
                  onChange={e => {
                    const hue = Number(e.target.value);
                    setLayers(prev =>
                      prev.map(l =>
                        l.id === activeLayerId
                          ? {...l, adjustmentParams: {...(l.adjustmentParams ?? DEFAULT_ADJUSTMENT), hue}}
                          : l
                      )
                    );
                  }}
                  onPointerUp={() => pushHistory('Hue')}
                />
                <span>{activeLayer.adjustmentParams.hue}</span>
              </label>
              <label className="photo-options__field">
                Saturation
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={activeLayer.adjustmentParams.saturation}
                  onChange={e => {
                    const saturation = Number(e.target.value);
                    setLayers(prev =>
                      prev.map(l =>
                        l.id === activeLayerId
                          ? {...l, adjustmentParams: {...(l.adjustmentParams ?? DEFAULT_ADJUSTMENT), saturation}}
                          : l
                      )
                    );
                  }}
                  onPointerUp={() => pushHistory('Saturation')}
                />
                <span>{activeLayer.adjustmentParams.saturation}</span>
              </label>
              <label className="photo-options__field">
                Lightness
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={activeLayer.adjustmentParams.lightness}
                  onChange={e => {
                    const lightness = Number(e.target.value);
                    setLayers(prev =>
                      prev.map(l =>
                        l.id === activeLayerId
                          ? {...l, adjustmentParams: {...(l.adjustmentParams ?? DEFAULT_ADJUSTMENT), lightness}}
                          : l
                      )
                    );
                  }}
                  onPointerUp={() => pushHistory('Lightness')}
                />
                <span>{activeLayer.adjustmentParams.lightness}</span>
              </label>
            </>
          ) : (
            <>
              <label className="photo-options__field">
                Brightness
                <input
                  type="range"
                  min={-150}
                  max={150}
                  value={activeLayer.adjustmentParams.brightness}
                  onChange={e => {
                    const brightness = Number(e.target.value);
                    setLayers(prev =>
                      prev.map(l =>
                        l.id === activeLayerId
                          ? {...l, adjustmentParams: {...(l.adjustmentParams ?? DEFAULT_ADJUSTMENT), brightness}}
                          : l
                      )
                    );
                  }}
                  onPointerUp={() => pushHistory('Brightness')}
                />
                <span>{activeLayer.adjustmentParams.brightness}</span>
              </label>
              <label className="photo-options__field">
                Contrast
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={activeLayer.adjustmentParams.contrast}
                  onChange={e => {
                    const contrast = Number(e.target.value);
                    setLayers(prev =>
                      prev.map(l =>
                        l.id === activeLayerId
                          ? {...l, adjustmentParams: {...(l.adjustmentParams ?? DEFAULT_ADJUSTMENT), contrast}}
                          : l
                      )
                    );
                  }}
                  onPointerUp={() => pushHistory('Contrast')}
                />
                <span>{activeLayer.adjustmentParams.contrast}</span>
              </label>
            </>
          )
        ) : null}
        {tool === 'zoom' && (
          <label className="photo-options__field">
            Zoom
            <input
              type="number"
              min={10}
              max={2000}
              value={zoomInputDraft ?? String(Math.round(zoom * 100))}
              disabled={!hasDoc}
              onFocus={e => {
                setZoomInputDraft(String(Math.round(zoom * 100)));
                e.target.select();
              }}
              onChange={e => setZoomInputDraft(e.target.value)}
              onBlur={e => commitZoomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setZoomInputDraft(null);
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            %
          </label>
        )}
        {activeLayer && activeLayer.kind !== 'adjustment' && tool !== 'zoom' ? (
          <>
            <label className="photo-options__field">
              Blend
              <select
                className="photo-options__select"
                value={activeLayer.blendMode}
                onChange={e => {
                  const blendMode = e.target.value as BlendMode;
                  setLayers(prev => prev.map(l => (l.id === activeLayerId ? {...l, blendMode} : l)));
                  pushHistory('Blend Mode');
                }}
              >
                {BLEND_MODES.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="photo-options__field">
              Opacity
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(activeLayer.opacity * 100)}
                onChange={e => {
                  const v = Number(e.target.value) / 100;
                  setLayers(prev => prev.map(l => (l.id === activeLayerId ? {...l, opacity: v} : l)));
                }}
              />
              <span>{Math.round(activeLayer.opacity * 100)}%</span>
            </label>
          </>
        ) : null}
        {editTarget === 'mask' ? <span className="photo-options__badge">Mask</span> : null}
      </PhotoOptionsBar>

      <div className="photo-body">
        <PhotoToolbar
          activeTool={tool}
          onSelect={selected => (selected === 'transform' ? beginTransform() : setTool(selected))}
          foreground={fg}
          background={bg}
          foregroundAlpha={fgAlpha}
          backgroundAlpha={bgAlpha}
          onForegroundChange={setFg}
          onBackgroundChange={setBg}
          onForegroundAlphaChange={setFgAlpha}
          onBackgroundAlphaChange={setBgAlpha}
          onSwapColors={() => {
            setFg(bg);
            setBg(fg);
            setFgAlpha(bgAlpha);
            setBgAlpha(fgAlpha);
          }}
          onResetColors={() => {
            setFg(DEFAULT_FG);
            setBg(DEFAULT_BG);
            setFgAlpha(100);
            setBgAlpha(100);
          }}
          shapeMode={shapeMode}
          onShapeModeChange={setShapeMode}
        />

        <div
          ref={viewportRef}
          className="photo-viewport"
          data-tool={tool}
          data-zoom-out={tool === 'zoom' && altPressed ? '' : undefined}
          data-filling={isFilling ? '' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => {
            if (tool === 'pen' && penPath) finishPenPath(false);
          }}
          onContextMenu={onContextMenu}
          onWheel={e => {
            if (!hasDoc) return;
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
            setZoom(z => clampZoom(z * factor));
          }}
        >
          {!hasDoc ? (
            <div className="photo-empty">
              <p>Open an image or create a new document</p>
              <div className="photo-empty__actions">
                <button type="button" onClick={() => setNewDialog(true)}>
                  New
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                  Open
                </button>
              </div>
              <p className="photo-empty__hint">Drop image files here · local only</p>
            </div>
          ) : (
            <canvas ref={viewCanvasRef} className="photo-view-canvas" />
          )}
          {editingTextLayer?.text ? (
            <PhotoTextEditor
              text={editingTextLayer.text}
              left={textViewOrigin.dx + editingTextLayer.text.x * zoom}
              top={textViewOrigin.dy + editingTextLayer.text.y * zoom}
              zoom={zoom}
              onChange={content => updateTextLayer(editingTextLayer.id, {content})}
              onCommit={commitTextEditing}
              onCancel={cancelTextEditing}
            />
          ) : null}
        </div>

        <PhotoSidebar>
          <div className="photo-sidebar__tabs">
            <button
              type="button"
              className={sidebarTab === 'layers' ? 'is-active' : ''}
              onClick={() => setSidebarTab('layers')}
            >
              Layers
            </button>
            <button
              type="button"
              className={sidebarTab === 'history' ? 'is-active' : ''}
              onClick={() => setSidebarTab('history')}
            >
              History
            </button>
          </div>

          {sidebarTab === 'layers' ? (
            <div className="photo-panel">
              <div className="photo-panel__head">
                <span>Layers</span>
                <div className="photo-panel__actions">
                  <button
                    type="button"
                    title="Move Layer Up"
                    disabled={!hasDoc || layers.findIndex(l => l.id === activeLayerId) >= layers.length - 1}
                    onClick={() => moveLayerUp()}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    title="Move Layer Down"
                    disabled={!hasDoc || layers.findIndex(l => l.id === activeLayerId) <= 0}
                    onClick={() => moveLayerDown()}
                  >
                    ▼
                  </button>
                  <button type="button" title="New Layer" disabled={!hasDoc} onClick={() => addLayer()}>
                    +
                  </button>
                  <button type="button" title="Adjustment" disabled={!hasDoc} onClick={addAdjustmentLayer}>
                    ±
                  </button>
                  <button
                    type="button"
                    title="Add Mask"
                    disabled={!activeLayer || activeLayer.kind !== 'raster' || activeLayer.hasMask}
                    onClick={addMask}
                  >
                    ▭
                  </button>
                  <button
                    type="button"
                    title={activeLayer?.locked ? 'Unlock Layer' : 'Lock Layer'}
                    disabled={!activeLayer}
                    onClick={() => {
                      if (!activeLayer) return;
                      pushHistory(activeLayer.locked ? 'Unlock Layer' : 'Lock Layer');
                      setLayers(prev => prev.map(layer => layer.id === activeLayer.id ? {...layer, locked: !layer.locked} : layer));
                    }}
                  >
                    {activeLayer?.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    type="button"
                    title="Delete Layer"
                    disabled={!hasDoc || layers.length <= 1}
                    onClick={() => deleteLayer()}
                  >
                    −
                  </button>
                </div>
              </div>
              <ul className="photo-layers">
                {[...layers].reverse().map(layer => (
                  <li
                    key={layer.id}
                    className={`photo-layer${layer.id === activeLayerId ? ' is-active' : ''}${layer.kind === 'adjustment' ? ' is-adj' : ''}${layer.kind === 'text' ? ' is-text' : ''}${dragLayerId === layer.id ? ' is-dragging' : ''}`}
                    draggable={renameId !== layer.id}
                    onDragStart={e => {
                      e.dataTransfer.effectAllowed = 'move';
                      setDragLayerId(layer.id);
                    }}
                    onDragOver={e => {
                      if (dragLayerId && dragLayerId !== layer.id) e.preventDefault();
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      if (!dragLayerId || dragLayerId === layer.id) return;
                      pushHistory('Reorder Layers');
                      setLayers(prev => moveLayerBeside(prev, dragLayerId, layer.id));
                      setDragLayerId(null);
                    }}
                    onDragEnd={() => setDragLayerId(null)}
                    onClick={() => {
                      setActiveLayerId(layer.id);
                      setEditTarget('layer');
                    }}
                    onContextMenu={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveLayerId(layer.id);
                      setContextMenu({x: e.clientX, y: e.clientY, target: 'layer', layerId: layer.id});
                    }}
                    onDoubleClick={() => {
                      if (layer.kind === 'text') startTextEditing(layer);
                      else {
                        setRenameId(layer.id);
                        setRenameValue(layer.name);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={`photo-layer__vis${layer.visible ? '' : ' is-off'}`}
                      title="Visibility"
                      onClick={e => {
                        e.stopPropagation();
                        setLayers(prev => prev.map(l => (l.id === layer.id ? {...l, visible: !l.visible} : l)));
                      }}
                    >
                      {layer.visible ? '●' : '○'}
                    </button>
                    <div className="photo-layer__main">
                      <LayerThumb
                        layer={layer}
                        buffers={buffersRef.current}
                        masks={masksRef.current}
                        docWidth={width}
                        docHeight={height}
                        version={historyTick}
                      />
                      {renameId === layer.id ? (
                        <input
                          className="photo-layer__rename"
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => {
                            setLayers(prev =>
                              prev.map(l => (l.id === layer.id ? {...l, name: renameValue.trim() || l.name} : l))
                            );
                            setRenameId('');
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setRenameId('');
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span className="photo-layer__name">
                          {layer.kind === 'adjustment' ? '◆ ' : ''}
                          {layer.kind === 'text' ? (
                            <>
                              <span className="photo-layer__type-icon">T</span>
                              {layer.text?.content.split('\n')[0] || layer.name}
                            </>
                          ) : layer.name}
                        </span>
                      )}
                      <span className="photo-layer__opacity">{Math.round(layer.opacity * 100)}%</span>
                      {layer.locked ? <span className="photo-layer__lock" title="Locked">🔒</span> : null}
                    </div>
                    {layer.hasMask ? (
                      <button
                        type="button"
                        className={`photo-layer__mask${editTarget === 'mask' && layer.id === activeLayerId ? ' is-active' : ''}`}
                        title="Layer mask"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveLayerId(layer.id);
                          setEditTarget('mask');
                        }}
                      >
                        ▣
                      </button>
                    ) : (
                      <span className="photo-layer__mask-spacer" />
                    )}
                  </li>
                ))}
              </ul>
              {activeLayer && activeLayer.kind !== 'adjustment' ? (
                <PhotoLayerStylePanel
                  style={activeLayer.style ?? DEFAULT_LAYER_STYLE}
                  canPaste={Boolean(layerStyleClipboardRef.current)}
                  onBeginChange={pushHistory}
                  onChange={updateActiveLayerStyle}
                  onCopy={() => copyLayerStyle()}
                  onPaste={() => pasteLayerStyle()}
                />
              ) : null}
            </div>
          ) : (
            <div className="photo-panel">
              <div className="photo-panel__head">
                <span>History</span>
              </div>
              <ul className="photo-history">
                {historyEntries.map((entry, index) => (
                  <li key={`${entry.label}-${index}`}>
                    <button
                      type="button"
                      className={`photo-history__item${index === historyIndex ? ' is-active' : ''}${index > historyIndex ? ' is-future' : ''}`}
                      onClick={() => applyHistory(index)}
                    >
                      {entry.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PhotoSidebar>
      </div>

      <div className="photo-statusbar">
        <span>
          {cursor.x}, {cursor.y}px
        </span>
        {tool !== 'zoom' && (
          <label className="photo-statusbar__zoom">
            <input
              type="number"
              min={10}
              max={2000}
              value={zoomInputDraft ?? String(Math.round(zoom * 100))}
              disabled={!hasDoc}
              onFocus={e => {
                setZoomInputDraft(String(Math.round(zoom * 100)));
                e.target.select();
              }}
              onChange={e => setZoomInputDraft(e.target.value)}
              onBlur={e => commitZoomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setZoomInputDraft(null);
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            %
          </label>
        )}
        <span>{status}</span>
        {selection ? (
          <span>
            Sel {Math.round(selection.w)} × {Math.round(selection.h)}
          </span>
        ) : null}
      </div>

      {contextMenu ? (
        <div
          className="photo-context"
          style={{left: contextMenu.x, top: contextMenu.y}}
          onClick={e => e.stopPropagation()}
        >
          {(contextMenu.target === 'layer'
            ? [
                {
                  label: 'Rename',
                  action: () => {
                    setRenameId(contextMenu.layerId!);
                    setRenameValue(layers.find(l => l.id === contextMenu.layerId)?.name ?? '');
                  }
                },
                {label: 'Duplicate Layer', action: () => duplicateLayer(contextMenu.layerId)},
                {label: 'Copy Layer Style', action: () => copyLayerStyle(contextMenu.layerId)},
                {label: 'Paste Layer Style', action: () => pasteLayerStyle(contextMenu.layerId)},
                {
                  label: layers.find(layer => layer.id === contextMenu.layerId)?.locked ? 'Unlock Layer' : 'Lock Layer',
                  action: () => toggleLock(contextMenu.layerId)
                },
                {label: 'Bring to Front', action: () => setLayerEdge('front', contextMenu.layerId)},
                {label: 'Send to Back', action: () => setLayerEdge('back', contextMenu.layerId)},
                {label: 'Rasterize Text', action: () => rasterizeText(contextMenu.layerId)},
                {label: 'Delete Layer', action: () => deleteLayer(contextMenu.layerId)},
                {label: 'Add Layer Mask', action: addMask},
                {label: 'Delete Layer Mask', action: deleteMask},
                {label: 'Merge Down', action: mergeDown}
              ]
            : [
                {label: 'Undo', action: undo},
                {label: 'Redo', action: redo},
                {label: 'Free Transform', action: beginTransform},
                {label: 'Cut', action: cutSelection},
                {label: 'Copy', action: copySelection},
                {label: 'Paste', action: pasteClipboard},
                {label: 'Deselect', action: deselect},
                {label: 'New Layer', action: () => addLayer()},
                {label: 'Duplicate Layer', action: () => duplicateLayer()},
                {label: 'Delete Layer', action: () => deleteLayer()}
              ]
          ).map(item => (
            <button
              key={item.label}
              type="button"
              className="photo-context__item"
              onClick={() => {
                item.action();
                closeContext();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <NewDocumentModal
        open={newDialog}
        width={newW}
        height={newH}
        fill={newFill}
        onWidthChange={setNewW}
        onHeightChange={setNewH}
        onFillChange={setNewFill}
        onCancel={() => setNewDialog(false)}
        onCreate={() => {
          const settings = {
            width: Math.round(newW),
            height: Math.round(newH),
            fill: newFill
          };
          saveNewDocumentSettings(settings);
          createDocument(settings.width, settings.height, settings.fill);
          setNewDialog(false);
        }}
      />
    </div>
  );
}
