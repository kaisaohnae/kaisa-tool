'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {mergePdfs} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const run = async () => {
    if (files.length < 2) {
      setError('PDF를 2개 이상 선택하세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const blob = await mergePdfs(files);
      setResult(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : '합치기에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="PDF 합치기" description="선택한 순서대로 PDF를 하나로 합칩니다.">
      <FileDropzone accept="application/pdf,.pdf" multiple files={files} onChange={next => { setFiles(next); setResult(null); }} hint="PDF 여러 개" />

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={files.length < 2 || busy} onClick={run}>
          {busy ? '합치는 중…' : '합치기'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result, 'merged.pdf')}>
            다운로드 ({formatBytes(result.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>
    </ToolPageShell>
  );
}
