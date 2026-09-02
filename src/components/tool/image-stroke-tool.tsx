'use client';

import {useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useImageStageDisplay} from '@/hooks/use-image-stage-display';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {detectOutputMime, getImageSize} from '@/modules/image';
import {
  applyStrokes,
  isValidStroke,
  normalizeStrokeRect,
  type StrokeShape,
  type StrokeType
} from '@/modules/image/stroke';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

interface StrokeItem extends StrokeShape {
  id: string;
}

let strokeId = 0;

function nextStrokeId() {
  strokeId += 1;
  return `stroke-${strokeId}`;
}

export default function ImageStrokeTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [natural, setNatural] = useState({width: 0, height: 0});
  const [strokes, setStrokes] = useState<StrokeItem[]>([]);
  const [draft, setDraft] = useState<StrokeShape | null>(null);
  const [strokeType, setStrokeType] = useState<StrokeType>('rect');
  const [maskOutside, setMaskOutside] = useState(false);
  const [color, setColor] = useState('#ff3b30');
  const [lineWidth, setLineWidth] = useState(4);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{startX: number; startY: number} | null>(null);
  const maskId = useId();

  const file = files[0];
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);
  const {display, updateDisplaySize} = useImageStageDisplay(wrapRef, natural);
  const scaleX = display.width / Math.max(1, natural.width);
  const scaleY = display.height / Math.max(1, natural.height);
  const strokeScale = (scaleX + scaleY) / 2;

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
        setStrokes([]);
        setDraft(null);
        setStrokeType('rect');
        setMaskOutside(false);
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

  const toNatural = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return {x: 0, y: 0};
    const box = stage.getBoundingClientRect();
    return {
      x: Math.round(Math.max(0, Math.min(natural.width, ((clientX - box.left) / box.width) * natural.width))),
      y: Math.round(Math.max(0, Math.min(natural.height, ((clientY - box.top) / box.height) * natural.height)))
    };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!natural.width) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toNatural(e.clientX, e.clientY);
    dragRef.current = {startX: pt.x, startY: pt.y};
    setDraft({type: strokeType, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, color, lineWidth});
    setResult(null);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !natural.width) return;
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

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraft(current => {
      if (!current || !isValidStroke(current)) return null;
      setStrokes(prev => [...prev, {id: nextStrokeId(), ...current}]);
      return null;
    });
  };

  const run = async () => {
    if (!file || strokes.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const blob = await applyStrokes(file, strokes, format, quality);
      const name = replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg');
      setResult({blob, name});
      downloadBlob(blob, name);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Stroke failed.');
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

  return (
    <ToolPageShell
      title="Stroke"
      description="Drag on the image to draw rectangular outlines in your chosen color."
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
            className="stroke-stage"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              src={previewUrl}
              alt={t('Stroke target')}
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
          </div>
        </div>
      ) : null}

      <div className="tool-controls">
        <div className="field field--block">
          <span className="field__label">{t('Shape')}</span>
          <div className="stroke-shape-options">
            <label className="stroke-shape-option">
              <input
                type="radio"
                name="stroke-shape"
                value="rect"
                checked={strokeType === 'rect'}
                onChange={() => {
                  setStrokeType('rect');
                  setDraft(null);
                  setResult(null);
                }}
              />
              <span>{t('Rectangle')}</span>
            </label>
            <label className="stroke-shape-option">
              <input
                type="radio"
                name="stroke-shape"
                value="line"
                checked={strokeType === 'line'}
                onChange={() => {
                  setStrokeType('line');
                  setDraft(null);
                  setResult(null);
                }}
              />
              <span>{t('Line')}</span>
            </label>
          </div>
        </div>
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
        <button type="button" className="btn btn--primary" disabled={!file || strokes.length === 0 || busy} onClick={run}>
          {busy ? t('Downloading…') : t('Download')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={strokes.length === 0}
          onClick={() => {
            setStrokes(prev => prev.slice(0, -1));
            setResult(null);
          }}
        >
          {t('Undo')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={strokes.length === 0}
          onClick={() => {
            setStrokes([]);
            setDraft(null);
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
