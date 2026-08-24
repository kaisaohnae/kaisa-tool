'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {pdfToJpg, zipFiles} from '@/modules/pdf';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function PdfToJpgTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.85);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; count: number} | null>(null);

  const file = files[0];

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const pages = await pdfToJpg(file, quality, 2);
      const zip = await zipFiles(pages);
      setResult({blob: zip, count: pages.length});
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="PDF → JPG" description="각 페이지를 JPG로 추출해 ZIP으로 받습니다.">
      <FileDropzone accept="application/pdf,.pdf" files={files} onChange={next => { setFiles(next); setResult(null); }} hint="PDF 1개" />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">JPG 품질 {Math.round(quality * 100)}%</span>
          <input className="field__range" type="range" min={0.4} max={1} step={0.05} value={quality} onChange={e => setQuality(Number(e.target.value))} />
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? '변환 중…' : 'JPG로 변환'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, `${file?.name.replace(/\.pdf$/i, '') || 'pdf'}-jpg.zip`)}>
            ZIP 다운로드 ({result.count}장 · {formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>
    </ToolPageShell>
  );
}
