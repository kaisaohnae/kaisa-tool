'use client';

import {useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {PhotoMenubar, type PhotoMenuKey} from './photo-menubar';
import {PhotoLayerStylePanel} from './photo-layer-style-panel';
import {LayerThumb} from './photo-layer-thumb';
import {usePhotoViewport} from './use-photo-viewport';
import {usePhotoHistory} from './use-photo-history';
import {usePhotoTextTool} from './use-photo-text-tool';
import {usePhotoTransformTool} from './use-photo-transform-tool';
import {usePhotoFileIO} from './use-photo-file-io';
import {usePhotoSelectionActions} from './use-photo-selection-actions';
import {usePhotoLayerFilters} from './use-photo-layer-filters';
import {usePhotoLayerActions} from './use-photo-layer-actions';
import {usePhotoDocumentSessions} from './use-photo-document-sessions';
import {usePhotoWorkspaceAutosave} from './use-photo-workspace-autosave';
import {NewDocumentModal} from './photo-modals';
import {PhotoOptionsBar} from './photo-options-bar';
import {PhotoSidebar} from './photo-sidebar';
import {PhotoTextEditor} from './photo-text-editor';
import {PhotoToolbar} from './photo-toolbar';
import {
  boxBlurCanvas,
  compositeLayers,
  createLayerCanvas,
  desaturateCanvas,
  drawBrushStroke,
  drawCloneStroke,
  drawLinearGradient,
  drawTransformedImage,
  floodFill,
  getOpaqueBounds,
  getTextLayerBounds,
  cloneCanvas,
  invertCanvas,
  magicWandBounds,
  pathFromSelection,
  rgbaToHex,
  sharpenCanvas,
  type HistorySnapshot,
  type LayerStyle,
  BLEND_MODES,
  DEFAULT_ADJUSTMENT,
  DEFAULT_BG,
  DEFAULT_FG,
  DEFAULT_LAYER_STYLE,
  TOOL_SHORTCUTS,
  boundsFromPoints,
  clampZoom,
  stepZoomLevel,
  createRasterLayer,
  createTextLayer,
  applyRetouchStamp,
  applyRetouchStroke,
  drawShape,
  drawVectorPath,
  tracePenPath,
  strokeSelectionArea,
  loadNewDocumentSettings,
  nextDocName,
  rectFromDrag,
  moveLayerBeside,
  saneGridSpacing,
  snapBox,
  selectionToMask,
  saveNewDocumentSettings,
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
export type DocumentSession = {
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


export default function PhotoEditor() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buffersRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const masksRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const selectionMaskRef = useRef<HTMLCanvasElement | null>(null);
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
  const {historyRef, historyIndexRef, pushHistory, applyHistory, undo, redo} = usePhotoHistory({
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
  });
  const historyEntries = historyRef.current;
  const historyIndex = historyIndexRef.current;

  const layerInputs = useCallback(() => {
    const inputs = toCompositeInputs(layers, buffersRef.current, masksRef.current, width, height);
    return textEditing
      ? inputs.map((input, index) => layers[index]?.id === textEditing.layerId ? {...input, visible: false} : input)
      : inputs;
  }, [layers, width, height, textEditing]);

  const {updateTextLayer, startTextEditing, commitTextEditing, cancelTextEditing} = usePhotoTextTool({
    layers,
    setLayers,
    textEditing,
    setTextEditing,
    setActiveLayerId,
    setEditTarget,
    setTool,
    setTextFontFamily,
    setTextFontSize,
    setTextFontWeight,
    setTextFontStyle,
    setTextAlign,
    setTextTracking,
    setTextLineHeight,
    setTextUnderline,
    setTextStrokeWidth,
    setTextStrokeColor,
    pushHistory,
    setStatus
  });

  useEffect(() => {
    if (textEditing && tool !== 'text') commitTextEditing();
  }, [tool, textEditing, commitTextEditing]);

  useEffect(() => {
    if (penPath && tool !== 'pen') {
      setPenPath(null);
      setPenHover(null);
    }
  }, [tool, penPath]);

  const {getDocPoint, snapDocPoint, getViewOrigin, commitZoomInput, fitZoom} = usePhotoViewport({
    viewportRef,
    pan,
    zoom,
    width,
    height,
    snapEnabled,
    guides,
    gridSize,
    hasDoc,
    setZoom,
    setPan,
    setZoomInputDraft
  });

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

  const {captureCurrentSession, applySession, switchToDocument, closeDocument, createDocument} = usePhotoDocumentSessions({
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
  });

  // Keeps the active tab's label/dirty-dot in sync with the live docName/dirty state, so a
  // rename or edit shows up on its tab immediately without any extra plumbing at each call site.
  useEffect(() => {
    if (!activeDocIdRef.current) return;
    const activeId = activeDocIdRef.current;
    setDocTabs(tabs =>
      tabs.map(t => (t.id === activeId && (t.name !== docName || t.dirty !== dirty) ? {...t, name: docName, dirty} : t))
    );
  }, [docName, dirty]);

  const {persistWorkspaceNow} = usePhotoWorkspaceAutosave({
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
  });

  const {
    addLayer,
    addAdjustmentLayer,
    addHueSaturationLayer,
    addLevelsLayer,
    duplicateLayer,
    copyLayerStyle,
    pasteLayerStyle,
    updateActiveLayerStyle,
    deleteLayer,
    moveLayerUp,
    moveLayerDown,
    setLayerEdge,
    toggleLock,
    rasterizeText,
    nudgeActiveLayer,
    mergeDown,
    addMask,
    deleteMask
  } = usePhotoLayerActions({
    hasDoc,
    layers,
    activeLayerId,
    activeLayer,
    width,
    height,
    textEditing,
    buffersRef,
    masksRef,
    layerStyleClipboardRef,
    pushHistory,
    paint,
    updateTextLayer,
    setLayers,
    setActiveLayerId,
    setEditTarget,
    setTextEditing,
    setStatus
  });

  const {beginTransform, applyTransform, cancelTransform} = usePhotoTransformTool({
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
  });

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

  const {openFiles, saveProject, saveAs} = usePhotoFileIO({
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
  });

  const {
    selectAll,
    deselect,
    invertSelection,
    clearSelectionContent,
    copySelection,
    cutSelection,
    pasteClipboard,
    fillSelection
  } = usePhotoSelectionActions({
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
  });

  const {getActiveRasterCanvas, applyFilterToActiveLayer, flipActiveLayer, applyRotate90, applyCrop} = usePhotoLayerFilters({
    activeLayer,
    activeLayerId,
    layers,
    width,
    height,
    cropDraft,
    buffersRef,
    masksRef,
    pushHistory,
    paint,
    setLayers,
    setWidth,
    setHeight,
    setCropDraft,
    setSelection,
    setStatus
  });

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
