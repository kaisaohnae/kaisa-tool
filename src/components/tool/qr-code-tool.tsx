'use client';

import {useEffect, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {
  DEFAULT_QR_OPTIONS,
  generateQrDataUrl,
  generateQrPngBlob,
  type QrErrorLevel,
  type QrOptions,
  type QrSize
} from '@/modules/format/qr';
import {downloadBlob} from '@/modules/shared/file';

export default function QrCodeTool() {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = <K extends keyof QrOptions>(key: K, value: QrOptions[K]) => {
    setOptions(prev => ({...prev, [key]: value}));
    setMessage(null);
  };

  useEffect(() => {
    const text = input.trim();
    if (!text) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      generateQrDataUrl(input, options)
        .then(url => {
          if (!cancelled) {
            setPreview(url);
            setMessage(null);
          }
        })
        .catch(err => {
          if (!cancelled) {
            setPreview(null);
            setMessage({type: 'error', text: err instanceof Error ? err.message : 'QR 생성에 실패했습니다.'});
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, options]);

  const download = async () => {
    if (!input.trim()) {
      setMessage({type: 'error', text: '내용을 입력하세요.'});
      return;
    }
    setBusy(true);
    try {
      const blob = await generateQrPngBlob(input, options);
      downloadBlob(blob, 'qrcode.png');
      setMessage({type: 'ok', text: 'PNG를 다운로드했습니다.'});
    } catch (err) {
      setMessage({type: 'error', text: err instanceof Error ? err.message : '다운로드에 실패했습니다.'});
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setInput('');
    setPreview(null);
    setMessage(null);
  };

  return (
    <ToolPageShell title="QR 코드" description="URL이나 텍스트를 입력하면 브라우저에서 QR 코드를 만듭니다. 서버로 전송되지 않습니다.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">크기</span>
          <select
            className="field__select"
            value={options.size}
            onChange={e => patch('size', Number(e.target.value) as QrSize)}
          >
            <option value={128}>128 px</option>
            <option value={256}>256 px</option>
            <option value={512}>512 px</option>
            <option value={1024}>1024 px</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">오류 복원</span>
          <select
            className="field__select"
            value={options.errorCorrectionLevel}
            onChange={e => patch('errorCorrectionLevel', e.target.value as QrErrorLevel)}
          >
            <option value="L">L (약 7%)</option>
            <option value="M">M (약 15%)</option>
            <option value="Q">Q (약 25%)</option>
            <option value="H">H (약 30%)</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">여백</span>
          <select
            className="field__select"
            value={options.margin}
            onChange={e => patch('margin', Number(e.target.value))}
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">전경</span>
          <input
            className="field__color"
            type="color"
            value={options.darkColor}
            onChange={e => patch('darkColor', e.target.value)}
            aria-label="QR 전경색"
          />
        </label>
        <label className="field">
          <span className="field__label">배경</span>
          <input
            className="field__color"
            type="color"
            value={options.lightColor}
            onChange={e => patch('lightColor', e.target.value)}
            aria-label="QR 배경색"
          />
        </label>
      </div>

      <label className="field field--block">
        <span className="field__label">내용</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder="https://tool.kaisa.co.kr/ 또는 텍스트"
          spellCheck={false}
          rows={5}
        />
      </label>

      <div className="qr-preview" aria-live="polite">
        {preview ? (
          <img src={preview} alt="생성된 QR 코드" width={Math.min(options.size, 320)} height={Math.min(options.size, 320)} />
        ) : (
          <p className="qr-preview__empty">내용을 입력하면 QR 미리보기가 표시됩니다.</p>
        )}
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={download} disabled={!preview || busy}>
          {busy ? '준비 중…' : 'PNG 다운로드'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !preview}>
          비우기
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {message.text}
          </p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
