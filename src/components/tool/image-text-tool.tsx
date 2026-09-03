'use client';

import {useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useImageStageDisplay} from '@/hooks/use-image-stage-display';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {detectOutputMime, getImageSize} from '@/modules/image';
import {
  applyTextLayers,
  DEFAULT_TEXT_FONT_FAMILY,
  TEXT_OUTLINE_COLOR,
  TEXT_OUTLINE_WIDTH,
  textFontWeightCss,
  type TextLayer
} from '@/modules/image/text';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

interface TextItem extends TextLayer {
  id: string;
}

const DRAG_THRESHOLD = 5;

let textId = 0;

function nextTextId() {
  textId += 1;
  return `text-${textId}`;
}

export default function ImageTextTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [natural, setNatural] = useState({width: 0, height: 0});
  const [layers, setLayers] = useState<TextItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [bold, setBold] = useState(true);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    startClientX: number;
    startClientY: number;
    dragging: boolean;
  } | null>(null);

  const file = files[0];
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);
  const {display, updateDisplaySize} = useImageStageDisplay(wrapRef, natural);
  const scaleX = display.width / Math.max(1, natural.width);
  const scaleY = display.height / Math.max(1, natural.height);
  const fontScale = (scaleX + scaleY) / 2;
  const selectedLayer = layers.find(layer => layer.id === selectedId);

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
        setLayers([]);
        setSelectedId('');
        setFontSize(48);
        setColor('#ffffff');
        setBold(true);
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
    if (!selectedId) return;
    const input = inputRefs.current.get(selectedId);
    if (!input || document.activeElement === input) return;
    input.focus();
    input.select();
  }, [selectedId, layers.length]);

  const toNatural = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return {x: 0, y: 0};
    const box = stage.getBoundingClientRect();
    return {
      x: Math.round(Math.max(0, Math.min(natural.width, ((clientX - box.left) / box.width) * natural.width))),
      y: Math.round(Math.max(0, Math.min(natural.height, ((clientY - box.top) / box.height) * natural.height)))
    };
  };

  const updateLayer = (id: string, patch: Partial<TextLayer>) => {
    setLayers(prev => prev.map(layer => (layer.id === id ? {...layer, ...patch} : layer)));
    setResult(null);
  };

  const addTextLayer = (x: number, y: number) => {
    const item: TextItem = {
      id: nextTextId(),
      content: '',
      x,
      y,
      fontSize,
      fontFamily: DEFAULT_TEXT_FONT_FAMILY,
      fontWeight: bold ? 'bold' : 'normal',
      color,
      outlineWidth: TEXT_OUTLINE_WIDTH,
      outlineColor: TEXT_OUTLINE_COLOR
    };
    setLayers(prev => [...prev, item]);
    setSelectedId(item.id);
    setResult(null);
    return item.id;
  };

  const onStagePointerDown = (e: ReactPointerEvent) => {
    if (!natural.width || dragRef.current) return;
    const pt = toNatural(e.clientX, e.clientY);
    addTextLayer(pt.x, pt.y);
  };

  const onLayerPointerDown = (e: ReactPointerEvent, layer: TextItem) => {
    e.stopPropagation();
    if (!natural.width) return;
    setSelectedId(layer.id);
    setFontSize(layer.fontSize);
    setColor(layer.color);
    setBold(layer.fontWeight === 'bold');
    const pt = toNatural(e.clientX, e.clientY);
    dragRef.current = {
      id: layer.id,
      offsetX: pt.x - layer.x,
      offsetY: pt.y - layer.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      dragging: false
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !natural.width) return;

    if (!drag.dragging) {
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.dragging = true;
      inputRefs.current.get(drag.id)?.blur();
    }

    const pt = toNatural(e.clientX, e.clientY);
    const x = Math.max(0, Math.min(natural.width, pt.x - drag.offsetX));
    const y = Math.max(0, Math.min(natural.height, pt.y - drag.offsetY));
    updateLayer(drag.id, {x, y});
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const patchSelectedStyle = (patch: Partial<TextLayer>) => {
    if (!selectedId) return;
    updateLayer(selectedId, patch);
    if (patch.fontSize !== undefined) setFontSize(patch.fontSize);
    if (patch.color !== undefined) setColor(patch.color);
    if (patch.fontWeight !== undefined) setBold(patch.fontWeight === 'bold');
  };

  const run = async () => {
    const validLayers = layers.filter(layer => layer.content.trim());
    if (!file || validLayers.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const blob = await applyTextLayers(file, validLayers, format, quality);
      const name = replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg');
      setResult({blob, name});
      downloadBlob(blob, name);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Text failed.');
    } finally {
      setBusy(false);
    }
  };

  const validCount = layers.filter(layer => layer.content.trim()).length;

  return (
    <ToolPageShell
      title="Text"
      description="Click on the image to place text. Drag to move it."
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
        <div ref={wrapRef} className="text-stage-wrap">
          <div
            ref={stageRef}
            className="text-stage"
            onPointerDown={onStagePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              src={previewUrl}
              alt={t('Text target')}
              width={display.width}
              height={display.height}
              draggable={false}
              onLoad={updateDisplaySize}
            />
            {layers.map(layer => {
              const size = Math.max(8, layer.fontSize * fontScale);
              return (
                <div
                  key={layer.id}
                  className={`text-stage__layer${selectedId === layer.id ? ' is-selected' : ''}`}
                  style={{
                    left: layer.x * scaleX,
                    top: layer.y * scaleY
                  }}
                >
                  <input
                    ref={node => {
                      if (node) inputRefs.current.set(layer.id, node);
                      else inputRefs.current.delete(layer.id);
                    }}
                    className="text-stage__input"
                    type="text"
                    value={layer.content}
                    placeholder={t('Enter text')}
                    style={{
                      fontSize: size,
                      color: layer.color,
                      fontWeight: textFontWeightCss(layer.fontWeight),
                      minWidth: `${Math.max(4, layer.content.length + 1)}ch`
                    }}
                    onChange={e => updateLayer(layer.id, {content: e.target.value})}
                    onFocus={() => {
                      setSelectedId(layer.id);
                      setFontSize(layer.fontSize);
                      setColor(layer.color);
                      setBold(layer.fontWeight === 'bold');
                    }}
                    onPointerDown={e => onLayerPointerDown(e, layer)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Font size')}</span>
          <input
            className="field__input"
            type="number"
            min={8}
            max={512}
            value={selectedLayer?.fontSize ?? fontSize}
            disabled={!selectedId}
            onChange={e => patchSelectedStyle({fontSize: Number(e.target.value) || 8})}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Color')}</span>
          <input
            className="field__color"
            type="color"
            value={selectedLayer?.color ?? color}
            disabled={!selectedId}
            onChange={e => patchSelectedStyle({color: e.target.value})}
          />
        </label>
        <label className="field field--checkbox">
          <input
            type="checkbox"
            checked={selectedLayer ? selectedLayer.fontWeight === 'bold' : bold}
            disabled={!selectedId}
            onChange={e => patchSelectedStyle({fontWeight: e.target.checked ? 'bold' : 'normal'})}
          />
          <span className="field__label">{t('Bold')}</span>
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
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!file}
          onClick={() => addTextLayer(Math.round(natural.width / 2), Math.round(natural.height / 2))}
        >
          {t('Add text')}
        </button>
        <button type="button" className="btn btn--primary" disabled={!file || validCount === 0 || busy} onClick={run}>
          {busy ? t('Downloading…') : t('Download')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={layers.length === 0}
          onClick={() => {
            setLayers(prev => {
              const next = prev.slice(0, -1);
              if (selectedId && !next.some(layer => layer.id === selectedId)) {
                setSelectedId('');
              }
              return next;
            });
            setResult(null);
          }}
        >
          {t('Undo')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={layers.length === 0}
          onClick={() => {
            setLayers([]);
            setSelectedId('');
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
