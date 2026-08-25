'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {translateProgress} from '@/i18n/translate';
import {splitPdf, zipFiles} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfSplitTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
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
      const parts = await splitPdf(file, setStatus);
      setStatus('Creating ZIP…');
      const blob = await zipFiles(parts);
      setResult({blob, count: parts.length});
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Split failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Split PDF" description="Split a PDF by pages.">
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

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Splitting…') : t('Split')}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result.blob, 'split-pages.zip')}
          >
            {t('Download ZIP')} ({result.count} {t('Page')} · {formatBytes(result.blob.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{translateProgress(status, t)}</p> : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
