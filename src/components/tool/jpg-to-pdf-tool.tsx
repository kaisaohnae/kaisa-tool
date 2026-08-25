'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {translateProgress} from '@/i18n/translate';
import {jpgToPdf} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function JpgToPdfTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const run = async () => {
    if (!files.length) return;
    setBusy(true);
    setError('');
    setStatus('Preparing…');
    try {
      const blob = await jpgToPdf(files, setStatus);
      setResult(blob);
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
    <ToolPageShell title="JPG → PDF" description="Put JPG images as pages into a PDF. Use ↑↓ to reorder.">
      <FileDropzone
        accept="image/jpeg,.jpg,.jpeg"
        multiple
        sortable
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="Multiple JPGs allowed"
      />

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!files.length || busy} onClick={run}>
          {busy ? t('Converting…') : t('Create PDF')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result, 'images.pdf')}>
            {t('Download')} ({formatBytes(result.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{translateProgress(status, t)}</p> : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
