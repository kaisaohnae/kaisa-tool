'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {detectOutputMime, getImageSize, resizeImage} from '@/modules/image';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageResizeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lock, setLock] = useState(true);
  const [ratio, setRatio] = useState(1);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];
  const resultUrl = useObjectUrl(result?.blob);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    getImageSize(file)
      .then(size => {
        if (cancelled) return;
        setWidth(size.width);
        setHeight(size.height);
        setRatio(size.width / size.height || 1);
        setFormat(detectOutputMime(file));
        setResult(null);
        setError('');
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : '이미지 정보를 읽지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const onWidth = (value: number) => {
    const next = Math.max(1, Math.min(8192, value));
    setWidth(next);
    if (lock && ratio) setHeight(Math.max(1, Math.min(8192, Math.round(next / ratio))));
    setResult(null);
  };

  const onHeight = (value: number) => {
    const next = Math.max(1, Math.min(8192, value));
    setHeight(next);
    if (lock && ratio) setWidth(Math.max(1, Math.min(8192, Math.round(next * ratio))));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await resizeImage(file, width, height, format, 0.92);
      setResult({blob, name: replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="이미지 사이즈 변경" description="가로·세로 픽셀 크기를 변경합니다. 최대 8192px까지 지원합니다.">
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
          <span className="field__label">가로 (px)</span>
          <input className="field__input" type="number" min={1} max={8192} value={width} onChange={e => onWidth(Number(e.target.value) || 1)} />
        </label>
        <label className="field">
          <span className="field__label">세로 (px)</span>
          <input className="field__input" type="number" min={1} max={8192} value={height} onChange={e => onHeight(Number(e.target.value) || 1)} />
        </label>
        <label className="field">
          <span className="field__label">저장 형식</span>
          <select
            className="field__select"
            value={format}
            onChange={e => {
              setFormat(e.target.value as 'image/jpeg' | 'image/png');
              setResult(null);
            }}
          >
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={lock} onChange={e => setLock(e.target.checked)} />
          <span className="field__label">비율 유지</span>
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? '처리 중…' : '사이즈 변경'}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            다운로드 ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{error}</p> : null}
      </div>

      {result && resultUrl ? (
        <div className="preview-box">
          <img src={resultUrl} alt="결과 미리보기" />
          <div className="preview-meta">
            <span>
              {width} × {height}
            </span>
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
