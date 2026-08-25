'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {detectOutputMime} from '@/modules/image';
import {transformImage, type FlipMode, type RotateDegrees} from '@/modules/image/transform';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageRotateTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [rotate, setRotate] = useState<RotateDegrees>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);

  useEffect(() => {
    if (!file) return;
    setFormat(detectOutputMime(file) === 'image/png' ? 'image/png' : 'image/jpeg');
    setResult(null);
    setError('');
  }, [file]);

  const flip: FlipMode = flipH && flipV ? 'both' : flipH ? 'horizontal' : flipV ? 'vertical' : 'none';

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await transformImage(file, {rotate, flip, mime: format, quality});
      setResult({blob, name: replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Processing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Rotate & Flip" description="Rotate and flip horizontally or vertically.">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
          setRotate(0);
          setFlipH(false);
          setFlipV(false);
        }}
        hint="JPG, PNG, WebP"
      />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Rotation angle')}</span>
          <select
            className="field__select"
            value={rotate}
            onChange={e => {
              setRotate(Number(e.target.value) as RotateDegrees);
              setResult(null);
            }}
          >
            <option value={0}>{t('None (0°)')}</option>
            <option value={90}>{t('Right 90°')}</option>
            <option value={180}>180°</option>
            <option value={270}>{t('Left 90°')}</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={flipH}
            onChange={e => {
              setFlipH(e.target.checked);
              setResult(null);
            }}
          />
          <span className="field__label">{t('Flip horizontal')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={flipV}
            onChange={e => {
              setFlipV(e.target.checked);
              setResult(null);
            }}
          />
          <span className="field__label">{t('Flip vertical')}</span>
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
          {busy ? t('Processing…') : t('Apply')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            {t('Download')} ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {file && previewUrl ? (
        <div className="preview-box">
          <p className="field__label">{t('Original preview')}</p>
          <img
            src={previewUrl}
            alt={t('Original')}
            style={{
              transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
            }}
          />
        </div>
      ) : null}

      {result && resultUrl ? (
        <div className="preview-box">
          <p className="field__label">{t('Result')}</p>
          <img src={resultUrl} alt={t('Result preview')} />
          <div className="preview-meta">
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
