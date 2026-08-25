'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {splitPdf, zipFiles} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfSplitTool() {
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
    setStatus('준비 중…');
    try {
      const pages = await splitPdf(file, setStatus);
      setStatus('ZIP 만드는 중…');
      const zip = await zipFiles(pages);
      setResult({blob: zip, count: pages.length});
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '분할에 실패했습니다.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="PDF 분할" description="페이지마다 개별 PDF로 나눠 ZIP으로 받습니다.">
      <FileDropzone
        accept="application/pdf,.pdf"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="PDF 1개"
      />

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? '분할 중…' : '분할'}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result.blob, `${file?.name.replace(/\.pdf$/i, '') || 'split'}-pages.zip`)}
          >
            ZIP 다운로드 ({result.count}페이지 · {formatBytes(result.blob.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{status}</p> : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>
    </ToolPageShell>
  );
}
