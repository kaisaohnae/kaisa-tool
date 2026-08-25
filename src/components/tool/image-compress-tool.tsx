'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {compressImage} from '@/modules/image';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageCompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];
  const resultUrl = useObjectUrl(result?.blob);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await compressImage(file, quality);
      if (blob.size >= file.size && quality >= 0.85) {
        setError('원본보다 작아지지 않았습니다. 품질을 더 낮춰 보세요.');
      }
      setResult({blob, name: replaceExtension(file.name, 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="이미지 용량 줄이기" description="품질을 낮춰 JPEG로 다시 저장합니다. 투명 배경은 흰색으로 처리되며, 파일은 브라우저에서만 처리됩니다.">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="JPG, PNG, WebP"
      />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">품질 {Math.round(quality * 100)}%</span>
          <input
            className="field__range"
            type="range"
            min={0.1}
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
          {busy ? '처리 중…' : '용량 줄이기'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            다운로드 ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>

      {file && result ? (
        <div className="preview-box">
          {resultUrl ? <img src={resultUrl} alt="결과 미리보기" /> : null}
          <div className="preview-meta">
            <span>원본 {formatBytes(file.size)}</span>
            <span>결과 {formatBytes(result.blob.size)}</span>
            <span>{Math.max(1, Math.round((result.blob.size / file.size) * 100))}%</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
