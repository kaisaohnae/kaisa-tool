'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {getImageSize, resizeImage} from '@/modules/image';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function ImageResizeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lock, setLock] = useState(true);
  const [ratio, setRatio] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    getImageSize(file)
      .then(size => {
        setWidth(size.width);
        setHeight(size.height);
        setRatio(size.width / size.height || 1);
        setResult(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : '이미지 정보를 읽지 못했습니다.'));
  }, [file]);

  const onWidth = (value: number) => {
    setWidth(value);
    if (lock && ratio) setHeight(Math.max(1, Math.round(value / ratio)));
  };

  const onHeight = (value: number) => {
    setHeight(value);
    if (lock && ratio) setWidth(Math.max(1, Math.round(value * ratio)));
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await resizeImage(file, width, height, 'image/jpeg', 0.92);
      setResult({blob, name: replaceExtension(file.name, 'jpg')});
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="이미지 사이즈 변경" description="가로·세로 픽셀 크기를 변경합니다.">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} hint="JPG, PNG, WebP 등" />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">가로 (px)</span>
          <input className="field__input" type="number" min={1} value={width} onChange={e => onWidth(Number(e.target.value) || 1)} />
        </label>
        <label className="field">
          <span className="field__label">세로 (px)</span>
          <input className="field__input" type="number" min={1} value={height} onChange={e => onHeight(Number(e.target.value) || 1)} />
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
    </ToolPageShell>
  );
}
