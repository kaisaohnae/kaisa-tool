'use client';

import {useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useImageStageDisplay} from '@/hooks/use-image-stage-display';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {detectOutputMime, getImageSize} from '@/modules/image';
import {
  aspectRatioValue,
  clampCropRect,
  cropImage,
  fitAspectCrop,
  type AspectPreset,
  type CropRect
} from '@/modules/image/crop';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageCropTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [natural, setNatural] = useState({width: 0, height: 0});
  const [rect, setRect] = useState<CropRect>({x: 0, y: 0, width: 100, height: 100});
  const [aspect, setAspect] = useState<AspectPreset>('free');
  const [maskOutside, setMaskOutside] = useState(false);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: 'create' | 'move';
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);

  const file = files[0];
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);
  const {display, updateDisplaySize} = useImageStageDisplay(wrapRef, natural);
  const scaleX = display.width / Math.max(1, natural.width);
  const scaleY = display.height / Math.max(1, natural.height);

  const withAspect = useCallback(
    (base: CropRect, preset: AspectPreset, maxW: number, maxH: number) => {
      const ratio = aspectRatioValue(preset);
      if (!ratio) return clampCropRect(base, maxW, maxH);
      return fitAspectCrop(base, ratio, maxW, maxH);
    },
    []
  );

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
        const w = Math.round(size.width * 0.8);
        const h = Math.round(size.height * 0.8);
        setRect(
          clampCropRect(
            {x: Math.round((size.width - w) / 2), y: Math.round((size.height - h) / 2), width: w, height: h},
            size.width,
            size.height
          )
        );
        setFormat(detectOutputMime(file));
        setMaskOutside(false);
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
      x: Math.round(((clientX - box.left) / box.width) * natural.width),
      y: Math.round(((clientY - box.top) / box.height) * natural.height)
    };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!natural.width) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toNatural(e.clientX, e.clientY);
    const inside =
      pt.x >= rect.x && pt.x <= rect.x + rect.width && pt.y >= rect.y && pt.y <= rect.y + rect.height;
    dragRef.current = {
      mode: inside ? 'move' : 'create',
      startX: pt.x,
      startY: pt.y,
      origin: {...rect}
    };
    if (!inside) {
      setRect(withAspect({x: pt.x, y: pt.y, width: 1, height: 1}, aspect, natural.width, natural.height));
    }
    setResult(null);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !natural.width) return;
    const pt = toNatural(e.clientX, e.clientY);
    if (drag.mode === 'create') {
      const x = Math.min(drag.startX, pt.x);
      const y = Math.min(drag.startY, pt.y);
      const width = Math.max(1, Math.abs(pt.x - drag.startX));
      const height = Math.max(1, Math.abs(pt.y - drag.startY));
      setRect(withAspect({x, y, width, height}, aspect, natural.width, natural.height));
    } else {
      const dx = pt.x - drag.startX;
      const dy = pt.y - drag.startY;
      setRect(
        clampCropRect(
          {...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy},
          natural.width,
          natural.height
        )
      );
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const patchRect = (partial: Partial<CropRect>) => {
    setRect(withAspect({...rect, ...partial}, aspect, natural.width, natural.height));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await cropImage(file, rect, format, quality);
      setResult({blob, name: replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Crop failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Crop" description="Drag to select a region or enter coordinates to crop the image.">
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
        <div ref={wrapRef} className="crop-stage-wrap">
          <div
            ref={stageRef}
            className="crop-stage"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              src={previewUrl}
              alt={t('Crop target')}
              width={display.width}
              height={display.height}
              draggable={false}
              onLoad={updateDisplaySize}
            />
            <div
              className={`crop-stage__rect${maskOutside ? ' crop-stage__rect--masked' : ''}`}
              style={{
                left: rect.x * scaleX,
                top: rect.y * scaleY,
                width: rect.width * scaleX,
                height: rect.height * scaleY
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">X</span>
          <input className="field__input" type="number" min={0} value={rect.x} onChange={e => patchRect({x: Number(e.target.value) || 0})} />
        </label>
        <label className="field">
          <span className="field__label">Y</span>
          <input className="field__input" type="number" min={0} value={rect.y} onChange={e => patchRect({y: Number(e.target.value) || 0})} />
        </label>
        <label className="field">
          <span className="field__label">{t('Width')}</span>
          <input className="field__input" type="number" min={1} value={rect.width} onChange={e => patchRect({width: Number(e.target.value) || 1})} />
        </label>
        <label className="field">
          <span className="field__label">{t('Height')}</span>
          <input className="field__input" type="number" min={1} value={rect.height} onChange={e => patchRect({height: Number(e.target.value) || 1})} />
        </label>
        <label className="field">
          <span className="field__label">{t('Aspect ratio')}</span>
          <select
            className="field__select"
            value={aspect}
            onChange={e => {
              const next = e.target.value as AspectPreset;
              setAspect(next);
              setRect(withAspect(rect, next, natural.width, natural.height));
              setResult(null);
            }}
          >
            <option value="free">{t('Free')}</option>
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
          </select>
        </label>
        <label className="field field--checkbox">
          <input
            type="checkbox"
            checked={maskOutside}
            onChange={e => setMaskOutside(e.target.checked)}
          />
          <span className="field__label">{t('Mask outside area')}</span>
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
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Cropping…') : t('Crop')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            {t('Download')} ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {result && resultUrl ? (
        <div className="preview-box">
          <img src={resultUrl} alt={t('Result preview')} />
          <div className="preview-meta">
            <span>
              {rect.width} × {rect.height}
            </span>
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
