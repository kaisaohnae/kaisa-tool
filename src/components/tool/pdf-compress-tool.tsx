'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {translateProgress} from '@/i18n/translate';
import {compressPdf} from '@/modules/pdf';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function PdfCompressTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setStatus('Preparing…');
    try {
      const blob = await compressPdf(file, quality, 1.25, setStatus);
      setResult({blob, name: replaceExtension(file.name, 'pdf')});
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Processing failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell
      title="Compress PDF"
      description="Re-pack each page as an image to shrink the file. Text selection and vectors may not be preserved."
    >
      <FileDropzone
        accept="application/pdf,.pdf"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="1 PDF"
      />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">
            {t('Image quality')} {Math.round(quality * 100)}%
          </span>
          <input
            className="field__range"
            type="range"
            min={0.3}
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
          {busy ? t('Compressing…') : t('Compress')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            {t('Download')} ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{translateProgress(status, t)}</p> : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {file && result ? (
        <div className="preview-meta" style={{marginTop: 12}}>
          <span>
            {t('Original')} {formatBytes(file.size)}
          </span>
          <span>
            {t('Result')} {formatBytes(result.blob.size)}
          </span>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
