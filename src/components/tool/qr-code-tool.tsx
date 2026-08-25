'use client';

import {useEffect, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
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
  const t = useT();
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
            setMessage({type: 'error', text: err instanceof Error ? err.message : 'QR generation failed.'});
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
      setMessage({type: 'error', text: 'Enter text.'});
      return;
    }
    setBusy(true);
    try {
      const blob = await generateQrPngBlob(input, options);
      downloadBlob(blob, 'qrcode.png');
      setMessage({type: 'ok', text: 'PNG downloaded.'});
    } catch (err) {
      setMessage({type: 'error', text: err instanceof Error ? err.message : 'Download failed.'});
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
    <ToolPageShell title="QR Code" description="Create a QR code from a URL or any text.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Size')}</span>
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
          <span className="field__label">{t('Error correction')}</span>
          <select
            className="field__select"
            value={options.errorCorrectionLevel}
            onChange={e => patch('errorCorrectionLevel', e.target.value as QrErrorLevel)}
          >
            <option value="L">L (~7%)</option>
            <option value="M">M (~15%)</option>
            <option value="Q">Q (~25%)</option>
            <option value="H">H (~30%)</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Margin')}</span>
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
          <span className="field__label">{t('Foreground')}</span>
          <input
            className="field__color"
            type="color"
            value={options.darkColor}
            onChange={e => patch('darkColor', e.target.value)}
            aria-label={t('QR foreground')}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Background')}</span>
          <input
            className="field__color"
            type="color"
            value={options.lightColor}
            onChange={e => patch('lightColor', e.target.value)}
            aria-label={t('QR background')}
          />
        </label>
      </div>

      <label className="field field--block">
        <span className="field__label">{t('Content')}</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder="https://tool.kaisa.co.kr/ or text"
          spellCheck={false}
          rows={5}
        />
      </label>

      <div className="qr-preview" aria-live="polite">
        {preview ? (
          <img
            src={preview}
            alt={t('Generated QR code')}
            width={Math.min(options.size, 320)}
            height={Math.min(options.size, 320)}
          />
        ) : (
          <p className="qr-preview__empty">{t('Preview appears when you enter text.')}</p>
        )}
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={download} disabled={!preview || busy}>
          {busy ? t('Preparing…') : t('PNG Download')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !preview}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {t(message.text)}
          </p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
