'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {detectOutputMime, getImageSize, resizeImage} from '@/modules/image';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageResizeTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lock, setLock] = useState(true);
  const [ratio, setRatio] = useState(1);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];
  const resultUrl = useObjectUrl(result?.blob);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    getImageSize(file)
      .then(size => {
        if (cancelled) return;
        setWidth(size.width);
        setHeight(size.height);
        setRatio(size.width / size.height || 1);
        setFormat(detectOutputMime(file));
        setResult(null);
        setError('');
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not read image info.');
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const onWidth = (value: number) => {
    const next = Math.max(1, Math.min(8192, value));
    setWidth(next);
    if (lock && ratio) setHeight(Math.max(1, Math.min(8192, Math.round(next / ratio))));
    setResult(null);
  };

  const onHeight = (value: number) => {
    const next = Math.max(1, Math.min(8192, value));
    setHeight(next);
    if (lock && ratio) setWidth(Math.max(1, Math.min(8192, Math.round(next * ratio))));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await resizeImage(file, width, height, format, 0.92);
      setResult({blob, name: replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Processing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Resize" description="Change width and height in pixels. Supports up to 8192px.">
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

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Width (px)')}</span>
          <input className="field__input" type="number" min={1} max={8192} value={width} onChange={e => onWidth(Number(e.target.value) || 1)} />
        </label>
        <label className="field">
          <span className="field__label">{t('Height (px)')}</span>
          <input className="field__input" type="number" min={1} max={8192} value={height} onChange={e => onHeight(Number(e.target.value) || 1)} />
        </label>
        <label className="field">
          <span className="field__label">{t('Output format')}</span>
          <select
            className="field__select"
            value={format}
            onChange={e => {
              setFormat(e.target.value as 'image/jpeg' | 'image/png');
              setResult(null);
            }}
          >
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={lock} onChange={e => setLock(e.target.checked)} />
          <span className="field__label">{t('Keep aspect ratio')}</span>
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Processing…') : t('Resize')}
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
              {width} × {height}
            </span>
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
