'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {compressImage} from '@/modules/image';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageCompressTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.7);
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
      const blob = await compressImage(file, quality);
      if (blob.size >= file.size && quality >= 0.85) {
        setError('Did not get smaller than the original. Try a lower quality.');
      }
      setResult({blob, name: replaceExtension(file.name, 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Processing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell
      title="Compress"
      description="Lower quality and re-save as JPEG. Transparent backgrounds become white. Files stay in your browser."
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
          <span className="field__label">
            {t('Quality')} {Math.round(quality * 100)}%
          </span>
          <input
            className="field__range"
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={quality}
            onChange={e => {
              setQuality(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Processing…') : t('Compress')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            {t('Download')} ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {file && result ? (
        <div className="preview-box">
          {resultUrl ? <img src={resultUrl} alt={t('Result preview')} /> : null}
          <div className="preview-meta">
            <span>
              {t('Original')} {formatBytes(file.size)}
            </span>
            <span>
              {t('Result')} {formatBytes(result.blob.size)}
            </span>
            <span>{Math.max(1, Math.round((result.blob.size / file.size) * 100))}%</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
