'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {translateProgress} from '@/i18n/translate';
import {mergePdfs} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfMergeTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const run = async () => {
    if (files.length < 2) {
      setError('Select at least 2 PDF files.');
      return;
    }
    setBusy(true);
    setError('');
    setStatus('Preparing…');
    try {
      const blob = await mergePdfs(files, setStatus);
      setResult(blob);
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Merge failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Merge PDF" description="Combine PDFs in the selected order. Use ↑↓ to reorder.">
      <FileDropzone
        accept="application/pdf,.pdf"
        multiple
        sortable
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="Multiple PDFs"
      />

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={files.length < 2 || busy} onClick={run}>
          {busy ? t('Merging…') : t('Merge')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result, 'merged.pdf')}>
            {t('Download')} ({formatBytes(result.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{translateProgress(status, t)}</p> : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
