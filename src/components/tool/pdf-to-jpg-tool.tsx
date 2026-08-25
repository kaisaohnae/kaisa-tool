'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {translateProgress} from '@/i18n/translate';
import {pdfToJpg, zipFiles} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfToJpgTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.85);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{blob: Blob; count: number} | null>(null);

  const file = files[0];

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setStatus('Preparing…');
    try {
      const images = await pdfToJpg(file, quality, 2, setStatus);
      setStatus('Creating ZIP…');
      const blob = await zipFiles(images);
      setResult({blob, count: images.length});
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Conversion failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="PDF → JPG" description="Extract each page as JPG and download a ZIP.">
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

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Converting…') : t('Convert to JPG')}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result.blob, 'pdf-pages.zip')}
          >
            {t('Download ZIP')} ({result.count} · {formatBytes(result.blob.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{translateProgress(status, t)}</p> : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
