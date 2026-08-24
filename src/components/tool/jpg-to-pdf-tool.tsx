'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {jpgToPdf} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function JpgToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const run = async () => {
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      const blob = await jpgToPdf(files);
      setResult(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다. JPG만 지원합니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="JPG → PDF" description="JPG 이미지를 페이지로 넣어 PDF를 만듭니다. (JPG만 지원)">
      <FileDropzone accept="image/jpeg,.jpg,.jpeg" multiple files={files} onChange={next => { setFiles(next); setResult(null); }} hint="JPG 여러 장 가능" />

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!files.length || busy} onClick={run}>
          {busy ? '변환 중…' : 'PDF 만들기'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result, 'images.pdf')}>
            다운로드 ({formatBytes(result.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>
    </ToolPageShell>
  );
}
