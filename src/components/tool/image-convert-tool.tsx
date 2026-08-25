'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {convertImage} from '@/modules/image';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

interface Props {
  title: string;
  description: string;
  accept: string;
  target: 'image/png' | 'image/jpeg';
  ext: string;
}

export default function ImageConvertTool({title, description, accept, target, ext}: Props) {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
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
      const blob = await convertImage(file, target, quality);
      setResult({blob, name: replaceExtension(file.name, ext)});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Processing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title={title} description={description}>
      <FileDropzone
        accept={accept}
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
      />

      {target === 'image/jpeg' ? (
        <div className="tool-controls">
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
        </div>
      ) : null}

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Converting…') : t('Convert')}
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
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
