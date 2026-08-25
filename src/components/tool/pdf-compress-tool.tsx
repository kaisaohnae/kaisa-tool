'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {compressPdf} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfCompressTool() {
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
    setStatus('준비 중…');
    try {
      const blob = await compressPdf(file, quality, 1.25, setStatus);
      const name = file.name.replace(/\.pdf$/i, '') + '-compressed.pdf';
      setResult({blob, name});
      setStatus('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="PDF 압축" description="각 페이지를 이미지로 다시 담아 용량을 줄입니다. 텍스트 선택·벡터는 유지되지 않을 수 있습니다.">
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

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">이미지 품질 {Math.round(quality * 100)}%</span>
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
          {busy ? '압축 중…' : '압축'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            다운로드 ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {status ? <p className="tool-status">{status}</p> : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>

      {file && result ? (
        <div className="preview-meta">
          <span>원본 {formatBytes(file.size)}</span>
          <span>결과 {formatBytes(result.blob.size)}</span>
          <span>{Math.max(1, Math.round((result.blob.size / file.size) * 100))}%</span>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
