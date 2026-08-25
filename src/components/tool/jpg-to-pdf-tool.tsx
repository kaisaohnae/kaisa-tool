'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {jpgToPdf} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function JpgToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const run = async () => {
    if (!files.length) return;
    setBusy(true);
    setError('');
    setStatus('준비 중…');
    try {
      const blob = await jpgToPdf(files, setStatus);
      setResult(blob);
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="JPG → PDF" description="JPG 이미지를 페이지로 넣어 PDF를 만듭니다. ↑↓로 페이지 순서를 바꿀 수 있습니다.">
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
        hint="JPG 여러 장 가능"
      />

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!files.length || busy} onClick={run}>
          {busy ? '변환 중…' : 'PDF 만들기'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result, 'images.pdf')}>
            다운로드 ({formatBytes(result.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{status}</p> : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>
    </ToolPageShell>
  );
}
