'use client';

import {useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useImageStageDisplay} from '@/hooks/use-image-stage-display';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {detectOutputMime, getImageSize} from '@/modules/image';
import {applyAnnotations} from '@/modules/image/annotate';
import {
  isValidStroke,
  normalizeStrokeRect,
  type StrokeShape,
  type StrokeType
} from '@/modules/image/stroke';
import {TEXT_OUTLINE_COLOR, TEXT_OUTLINE_WIDTH, type TextLayer} from '@/modules/image/text';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

type ToolMode = StrokeType | 'text';

type AnnotStroke = StrokeShape & {id: string; kind: 'stroke'};
type AnnotText = TextLayer & {id: string; kind: 'text'};
type AnnotItem = AnnotStroke | AnnotText;

const DRAG_THRESHOLD = 5;
const DEFAULT_COLOR = '#ff0000';

let annotId = 0;

function nextAnnotId() {
  annotId += 1;
  return `annot-${annotId}`;
}

export default function ImageStrokeTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [natural, setNatural] = useState({width: 0, height: 0});
  const [items, setItems] = useState<AnnotItem[]>([]);
  const [draft, setDraft] = useState<StrokeShape | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('rect');
  const [selectedTextId, setSelectedTextId] = useState('');
  const [maskOutside, setMaskOutside] = useState(false);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [lineWidth, setLineWidth] = useState(4);
  const [fontSize, setFontSize] = useState(14);
  const [bold, setBold] = useState(true);
  const [outlineWidth, setOutlineWidth] = useState(TEXT_OUTLINE_WIDTH);
  const [outlineColor, setOutlineColor] = useState(TEXT_OUTLINE_COLOR);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const listInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const strokeDragRef = useRef<{startX: number; startY: number} | null>(null);
  const textDragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    startClientX: number;
    startClientY: number;
    dragging: boolean;
  } | null>(null);
  const maskId = useId();

  const file = files[0];
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);
  const {display, updateDisplaySize} = useImageStageDisplay(wrapRef, natural);
  const scaleX = display.width / Math.max(1, natural.width);
  const scaleY = display.height / Math.max(1, natural.height);
  const strokeScale = (scaleX + scaleY) / 2;
  const fontScale = strokeScale;

  const strokes = items.filter((item): item is AnnotStroke => item.kind === 'stroke');
  const texts = items.filter((item): item is AnnotText => item.kind === 'text');
  const hasContent = strokes.length > 0 || texts.some(item => item.content.trim());

  useEffect(() => {
    if (!file) {
      setNatural({width: 0, height: 0});
      return;
    }
    let cancelled = false;
    getImageSize(file)
      .then(size => {
        if (cancelled) return;
        setNatural(size);
        setItems([]);
        setDraft(null);
        setToolMode('rect');
        setSelectedTextId('');
        setMaskOutside(false);
        setColor(DEFAULT_COLOR);
        setLineWidth(4);
        setFontSize(14);
        setBold(true);
        setOutlineWidth(TEXT_OUTLINE_WIDTH);
        setOutlineColor(TEXT_OUTLINE_COLOR);
        setFormat(detectOutputMime(file));
        setResult(null);
        setError('');
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not read image.');
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!selectedTextId || toolMode !== 'text') return;
    const input = listInputRefs.current.get(selectedTextId);
    if (!input || document.activeElement === input) return;
    input.focus();
    input.select();
  }, [selectedTextId, texts.length, toolMode]);

  const selectText = (layer: AnnotText) => {
    setSelectedTextId(layer.id);
    setFontSize(layer.fontSize);
    setColor(layer.color);
    setBold(layer.bold);
    setOutlineWidth(layer.outlineWidth);
    setOutlineColor(layer.outlineColor);
    setResult(null);
  };

  const removeText = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedTextId === id) setSelectedTextId('');
    setResult(null);
  };

  const toNatural = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return {x: 0, y: 0};
    const box = stage.getBoundingClientRect();
    return {
      x: Math.round(Math.max(0, Math.min(natural.width, ((clientX - box.left) / box.width) * natural.width))),
      y: Math.round(Math.max(0, Math.min(natural.height, ((clientY - box.top) / box.height) * natural.height)))
    };
  };

  const updateText = (id: string, patch: Partial<TextLayer>) => {
    setItems(prev => prev.map(item => (item.id === id && item.kind === 'text' ? {...item, ...patch} : item)));
    setResult(null);
  };

  const addTextLayer = (x: number, y: number) => {
    const item: AnnotText = {
      id: nextAnnotId(),
      kind: 'text',
      content: '',
      x,
      y,
      fontSize,
      color,
      bold,
      outlineWidth,
      outlineColor
    };
    setItems(prev => [...prev, item]);
    setSelectedTextId(item.id);
    setResult(null);
  };

  const onStagePointerDown = (e: ReactPointerEvent) => {
    if (!natural.width || textDragRef.current) return;

    if (toolMode === 'text') {
      const pt = toNatural(e.clientX, e.clientY);
      addTextLayer(pt.x, pt.y);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toNatural(e.clientX, e.clientY);
    strokeDragRef.current = {startX: pt.x, startY: pt.y};
    setSelectedTextId('');
    setDraft({
      type: toolMode,
      x1: pt.x,
      y1: pt.y,
      x2: pt.x,
      y2: pt.y,
      color,
      lineWidth
    });
    setResult(null);
  };

  const onStrokePointerMove = (e: ReactPointerEvent) => {
    const drag = strokeDragRef.current;
    if (!drag || !natural.width || toolMode === 'text') return;
    const pt = toNatural(e.clientX, e.clientY);
    setDraft(current =>
      current
        ? {
            ...current,
            x2: pt.x,
            y2: pt.y,
            color,
            lineWidth
          }
        : null
    );
  };

  const onStrokePointerUp = () => {
    const drag = strokeDragRef.current;
    if (!drag) return;
    strokeDragRef.current = null;
    setDraft(current => {
      if (!current || !isValidStroke(current)) return null;
      setItems(prev => [...prev, {id: nextAnnotId(), kind: 'stroke', ...current}]);
      return null;
    });
  };

  const onTextPointerDown = (e: ReactPointerEvent, layer: AnnotText) => {
    e.stopPropagation();
    if (!natural.width) return;
    selectText(layer);
    const pt = toNatural(e.clientX, e.clientY);
    textDragRef.current = {
      id: layer.id,
      offsetX: pt.x - layer.x,
      offsetY: pt.y - layer.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      dragging: false
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTextPointerMove = (e: ReactPointerEvent) => {
    const drag = textDragRef.current;
    if (!drag || !natural.width) return;

    if (!drag.dragging) {
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.dragging = true;
    }

    const pt = toNatural(e.clientX, e.clientY);
    updateText(drag.id, {
      x: Math.max(0, Math.min(natural.width, pt.x - drag.offsetX)),
      y: Math.max(0, Math.min(natural.height, pt.y - drag.offsetY))
    });
  };

  const onTextPointerUp = () => {
    textDragRef.current = null;
  };

  const run = async () => {
    const validTexts = texts.filter(item => item.content.trim());
    if (!file || (strokes.length === 0 && validTexts.length === 0)) return;
    setBusy(true);
    setError('');
    try {
      const blob = await applyAnnotations(file, strokes, validTexts, format, quality);
      const name = replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg');
      setResult({blob, name});
      downloadBlob(blob, name);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Annotation failed.');
    } finally {
      setBusy(false);
    }
  };

  const renderRectStroke = (stroke: StrokeShape, key: string) => {
    const {x1, y1, x2, y2} = normalizeStrokeRect(stroke.x1, stroke.y1, stroke.x2, stroke.y2);
    return (
      <div
        key={key}
        className="stroke-stage__rect"
        style={{
          left: x1 * scaleX,
          top: y1 * scaleY,
          width: (x2 - x1) * scaleX,
          height: (y2 - y1) * scaleY,
          borderColor: stroke.color,
          borderWidth: Math.max(1, stroke.lineWidth * strokeScale)
        }}
      />
    );
  };

  const renderLineStroke = (stroke: StrokeShape, key: string) => (
    <line
      key={key}
      x1={stroke.x1 * scaleX}
      y1={stroke.y1 * scaleY}
      x2={stroke.x2 * scaleX}
      y2={stroke.y2 * scaleY}
      stroke={stroke.color}
      strokeWidth={Math.max(1, stroke.lineWidth * strokeScale)}
      strokeLinecap="round"
    />
  );

  const hasLineStrokes = strokes.some(s => s.type === 'line') || draft?.type === 'line';
  const maskRects = [
    ...strokes.filter(s => s.type === 'rect'),
    ...(draft?.type === 'rect' ? [draft] : [])
  ];

  const renderMaskRect = (stroke: StrokeShape, key: string) => {
    const {x1, y1, x2, y2} = normalizeStrokeRect(stroke.x1, stroke.y1, stroke.x2, stroke.y2);
    return (
      <rect
        key={key}
        x={x1 * scaleX}
        y={y1 * scaleY}
        width={(x2 - x1) * scaleX}
        height={(y2 - y1) * scaleY}
        fill="black"
      />
    );
  };

  const stageClass =
    toolMode === 'text' ? 'stroke-stage text-stage text-stage--place' : 'stroke-stage';

  return (
    <ToolPageShell
      title="Stroke"
      description="Draw shapes and place text on the image, then download."
    >
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="JPG, PNG, WebP"
      />

      {file && previewUrl && natural.width ? (
        <div ref={wrapRef} className="stroke-stage-wrap">
          <div
            ref={stageRef}
            className={stageClass}
            onPointerDown={onStagePointerDown}
            onPointerMove={e => {
              onStrokePointerMove(e);
              onTextPointerMove(e);
            }}
            onPointerUp={() => {
              onStrokePointerUp();
              onTextPointerUp();
            }}
            onPointerCancel={() => {
              onStrokePointerUp();
              onTextPointerUp();
            }}
          >
            <img
              src={previewUrl}
              alt={t('Annotation target')}
              width={display.width}
              height={display.height}
              draggable={false}
              onLoad={updateDisplaySize}
            />
            {maskOutside && maskRects.length > 0 ? (
              <svg className="stroke-stage__mask" viewBox={`0 0 ${display.width} ${display.height}`}>
                <defs>
                  <mask id={maskId}>
                    <rect x="0" y="0" width={display.width} height={display.height} fill="white" />
                    {maskRects.map((stroke, index) => renderMaskRect(stroke, `mask-${index}`))}
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={display.width}
                  height={display.height}
                  fill="rgba(0, 0, 0, 0.5)"
                  mask={`url(#${maskId})`}
                />
              </svg>
            ) : null}
            {strokes.filter(s => s.type === 'rect').map(stroke => renderRectStroke(stroke, stroke.id))}
            {draft?.type === 'rect' ? renderRectStroke(draft, 'draft') : null}
            {hasLineStrokes ? (
              <svg className="stroke-stage__svg" viewBox={`0 0 ${display.width} ${display.height}`}>
                {strokes
                  .filter(s => s.type === 'line')
                  .map(stroke => renderLineStroke(stroke, stroke.id))}
                {draft?.type === 'line' ? renderLineStroke(draft, 'draft') : null}
              </svg>
            ) : null}
            {texts.map(layer => {
              const size = Math.max(8, layer.fontSize * fontScale);
              const empty = !layer.content.trim();
              const strokeWidth = Math.max(0, layer.outlineWidth) * fontScale;
              return (
                <div
                  key={layer.id}
                  className={`text-stage__layer${selectedTextId === layer.id ? ' is-selected' : ''}${empty ? ' is-empty' : ''}`}
                  style={{
                    left: layer.x * scaleX,
                    top: layer.y * scaleY,
                    fontSize: size,
                    color: layer.color,
                    fontWeight: layer.bold ? 'bold' : 'normal',
                    WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${layer.outlineColor}` : undefined,
                    paintOrder: 'stroke fill'
                  }}
                  onPointerDown={e => onTextPointerDown(e, layer)}
                >
                  {empty ? t('Enter text') : layer.content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {texts.length > 0 ? (
        <div className="text-layer-list">
          <p className="text-layer-list__title">{t('Text layers')}</p>
          <ul className="text-layer-list__items">
            {texts.map((layer, index) => (
              <li
                key={layer.id}
                className={`text-layer-list__item${selectedTextId === layer.id ? ' is-selected' : ''}`}
              >
                <span className="text-layer-list__index">{index + 1}</span>
                <div className="text-layer-list__body">
                  <div className="text-layer-list__row">
                    <input
                      ref={node => {
                        if (node) listInputRefs.current.set(layer.id, node);
                        else listInputRefs.current.delete(layer.id);
                      }}
                      className="field__input text-layer-list__input"
                      type="text"
                      value={layer.content}
                      placeholder={t('Enter text')}
                      onChange={e => updateText(layer.id, {content: e.target.value})}
                      onFocus={() => selectText(layer)}
                    />
                    <button
                      type="button"
                      className="btn btn--ghost text-layer-list__remove"
                      onClick={() => removeText(layer.id)}
                    >
                      {t('Remove')}
                    </button>
                  </div>
                  <div className="text-layer-list__meta">
                    <label className="text-layer-list__control">
                      <span className="text-layer-list__control-label">{t('Font size')}</span>
                      <input
                        className="field__input text-layer-list__size"
                        type="number"
                        min={8}
                        max={512}
                        value={layer.fontSize}
                        onChange={e => updateText(layer.id, {fontSize: Number(e.target.value) || 8})}
                        onFocus={() => selectText(layer)}
                      />
                    </label>
                    <label className="text-layer-list__control">
                      <span className="text-layer-list__control-label">{t('Color')}</span>
                      <input
                        className="field__color"
                        type="color"
                        value={layer.color}
                        onChange={e => updateText(layer.id, {color: e.target.value})}
                        onFocus={() => selectText(layer)}
                      />
                    </label>
                    <label className="text-layer-list__control text-layer-list__control--checkbox">
                      <input
                        type="checkbox"
                        checked={layer.bold}
                        onChange={e => updateText(layer.id, {bold: e.target.checked})}
                        onFocus={() => selectText(layer)}
                      />
                      <span className="text-layer-list__control-label">{t('Bold')}</span>
                    </label>
                  </div>
                  <div className="text-layer-list__meta">
                    <label className="text-layer-list__control">
                      <span className="text-layer-list__control-label">{t('Outline width')}</span>
                      <input
                        className="field__input text-layer-list__size"
                        type="number"
                        min={0}
                        max={24}
                        value={layer.outlineWidth}
                        onChange={e => updateText(layer.id, {outlineWidth: Number(e.target.value) || 0})}
                        onFocus={() => selectText(layer)}
                      />
                    </label>
                    <label className="text-layer-list__control">
                      <span className="text-layer-list__control-label">{t('Outline color')}</span>
                      <input
                        className="field__color"
                        type="color"
                        value={layer.outlineColor}
                        disabled={layer.outlineWidth <= 0}
                        onChange={e => updateText(layer.id, {outlineColor: e.target.value})}
                        onFocus={() => selectText(layer)}
                      />
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="tool-controls">
        <div className="field field--block">
          <span className="field__label">{t('Tool')}</span>
          <div className="stroke-shape-options">
            <label className="stroke-shape-option">
              <input
                type="radio"
                name="annot-tool"
                value="rect"
                checked={toolMode === 'rect'}
                onChange={() => {
                  setToolMode('rect');
                  setDraft(null);
                  setSelectedTextId('');
                  setResult(null);
                }}
              />
              <span>{t('Rectangle')}</span>
            </label>
            <label className="stroke-shape-option">
              <input
                type="radio"
                name="annot-tool"
                value="line"
                checked={toolMode === 'line'}
                onChange={() => {
                  setToolMode('line');
                  setDraft(null);
                  setSelectedTextId('');
                  setResult(null);
                }}
              />
              <span>{t('Line')}</span>
            </label>
            <label className="stroke-shape-option">
              <input
                type="radio"
                name="annot-tool"
                value="text"
                checked={toolMode === 'text'}
                onChange={() => {
                  setToolMode('text');
                  setDraft(null);
                  setResult(null);
                }}
              />
              <span>{t('Text')}</span>
            </label>
          </div>
        </div>
        {toolMode !== 'text' ? (
          <>
            <label className="field field--checkbox">
              <input
                type="checkbox"
                checked={maskOutside}
                onChange={e => setMaskOutside(e.target.checked)}
              />
              <span className="field__label">{t('Mask outside area')}</span>
            </label>
            <label className="field">
              <span className="field__label">{t('Color')}</span>
              <input
                className="field__color"
                type="color"
                value={color}
                onChange={e => {
                  setColor(e.target.value);
                  setResult(null);
                }}
              />
            </label>
            <label className="field">
              <span className="field__label">
                {t('Line width')} {lineWidth}px
              </span>
              <input
                className="field__range"
                type="range"
                min={1}
                max={24}
                step={1}
                value={lineWidth}
                onChange={e => {
                  setLineWidth(Number(e.target.value));
                  setResult(null);
                }}
              />
            </label>
          </>
        ) : null}
        <label className="field">
          <span className="field__label">{t('Output format')}</span>
          <select
            className="field__select"
            value={format}
            onChange={e => {
              setFormat(e.target.value as 'image/png' | 'image/jpeg');
              setResult(null);
            }}
          >
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPG</option>
          </select>
        </label>
        {format === 'image/jpeg' ? (
          <label className="field">
            <span className="field__label">
              {t('JPG quality')} {Math.round(quality * 100)}%
            </span>
            <input
              className="field__range"
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={e => {
                setQuality(Number(e.target.value));
                setResult(null);
              }}
            />
          </label>
        ) : null}
      </div>

      <div className="tool-actions">
        {toolMode === 'text' ? (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={!file}
            onClick={() => addTextLayer(Math.round(natural.width / 2), Math.round(natural.height / 2))}
          >
            {t('Add text')}
          </button>
        ) : null}
        {selectedTextId && toolMode === 'text' ? (
          <button type="button" className="btn btn--ghost" onClick={() => removeText(selectedTextId)}>
            {t('Remove')}
          </button>
        ) : null}
        <button type="button" className="btn btn--primary" disabled={!file || !hasContent || busy} onClick={run}>
          {busy ? t('Downloading…') : t('Download')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={items.length === 0}
          onClick={() => {
            setItems(prev => {
              const next = prev.slice(0, -1);
              if (selectedTextId && !next.some(item => item.id === selectedTextId)) {
                setSelectedTextId('');
              }
              return next;
            });
            setDraft(null);
            setResult(null);
          }}
        >
          {t('Undo')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={items.length === 0}
          onClick={() => {
            setItems([]);
            setDraft(null);
            setSelectedTextId('');
            setResult(null);
          }}
        >
          {t('Clear')}
        </button>
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {result && resultUrl ? (
        <div className="preview-box">
          <img src={resultUrl} alt={t('Result preview')} />
          <div className="preview-meta">
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
