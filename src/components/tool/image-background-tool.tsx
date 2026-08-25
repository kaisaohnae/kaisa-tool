'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {flattenOntoColor, removeNearColor} from '@/modules/image/background';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

type Mode = 'flatten' | 'chroma';

export default function ImageBackgroundTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>('flatten');
  const [color, setColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(40);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];
  const resultUrl = useObjectUrl(result?.blob);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'flatten') {
        const blob = await flattenOntoColor(file, color, format, quality);
        setResult({blob, name: replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg')});
      } else {
        const blob = await removeNearColor(file, color, tolerance);
        setResult({blob, name: replaceExtension(file.name, 'png')});
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Processing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell
      title="Background"
      description="Flatten a transparent PNG onto a solid color, or make similar colors transparent to remove the background."
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

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Mode')}</span>
          <select
            className="field__select"
            value={mode}
            onChange={e => {
              setMode(e.target.value as Mode);
              setResult(null);
            }}
          >
            <option value="flatten">{t('Flatten onto solid color')}</option>
            <option value="chroma">{t('Similar color → transparent')}</option>
          </select>
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
        {mode === 'chroma' ? (
          <label className="field">
            <span className="field__label">
              {t('Tolerance')} {tolerance}
            </span>
            <input
              className="field__range"
              type="range"
              min={0}
              max={120}
              step={1}
              value={tolerance}
              onChange={e => {
                setTolerance(Number(e.target.value));
                setResult(null);
              }}
            />
          </label>
        ) : (
          <>
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
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
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
          </>
        )}
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

      {result && resultUrl ? (
        <div className="preview-box">
          <img src={resultUrl} alt={t('Result preview')} className={mode === 'chroma' ? 'preview-box__checkered' : undefined} />
          <div className="preview-meta">
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
