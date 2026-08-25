'use client';

import {useEffect, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {nowParts, parseTimestampInput, type TimestampParts} from '@/modules/util/timestamp';

export default function TimestampTool() {
  const t = useT();
  const [live, setLive] = useState<TimestampParts | null>(null);
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<TimestampParts | null>(null);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  useEffect(() => {
    setLive(nowParts());
    const id = window.setInterval(() => setLive(nowParts()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parse = () => {
    const result = parseTimestampInput(input);
    if (!result.ok) {
      setParsed(null);
      setMessage({type: 'error', text: result.error});
      return;
    }
    setParsed(result.parts);
    setMessage({type: 'ok', text: 'Converted.'});
  };

  const useNow = () => {
    const parts = nowParts();
    setInput(String(parts.ms));
    setParsed(parts);
    setMessage({type: 'ok', text: 'Inserted current time.'});
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage({type: 'ok', text: 'Copied to clipboard.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setInput('');
    setParsed(null);
    setMessage(null);
  };

  const display = parsed;

  return (
    <ToolPageShell
      title="Timestamp"
      description="Convert between Unix time (seconds/milliseconds) and ISO dates."
    >
      {live ? (
        <div className="stats-grid">
          <div className="stats-grid__item">
            <span className="stats-grid__label">{t('Now (ms)')}</span>
            <strong className="stats-grid__value stats-grid__value--sm">{live.ms}</strong>
          </div>
          <div className="stats-grid__item">
            <span className="stats-grid__label">{t('Now (seconds)')}</span>
            <strong className="stats-grid__value stats-grid__value--sm">{live.seconds}</strong>
          </div>
          <div className="stats-grid__item">
            <span className="stats-grid__label">{t('Local')}</span>
            <strong className="stats-grid__value stats-grid__value--sm">{live.local}</strong>
          </div>
          <div className="stats-grid__item">
            <span className="stats-grid__label">ISO (UTC)</span>
            <strong className="stats-grid__value stats-grid__value--sm">{live.iso}</strong>
          </div>
        </div>
      ) : null}

      <div className="tool-controls">
        <label className="field" style={{minWidth: 280, flex: 1}}>
          <span className="field__label">{t('Input (Unix s/ms or ISO)')}</span>
          <input
            className="field__input"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setMessage(null);
            }}
            placeholder="1710000000 or 2024-01-01T00:00:00Z"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={parse} disabled={!input.trim()}>
          {t('Convert')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={useNow}>
          {t('Now')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !parsed}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>

      {display ? (
        <div className="stats-grid">
          <button type="button" className="stats-grid__item stats-grid__item--click" onClick={() => copy(String(display.ms))}>
            <span className="stats-grid__label">{t('Milliseconds')}</span>
            <strong className="stats-grid__value stats-grid__value--sm">{display.ms}</strong>
          </button>
          <button type="button" className="stats-grid__item stats-grid__item--click" onClick={() => copy(String(display.seconds))}>
            <span className="stats-grid__label">{t('Seconds')}</span>
            <strong className="stats-grid__value stats-grid__value--sm">{display.seconds}</strong>
          </button>
          <button type="button" className="stats-grid__item stats-grid__item--click" onClick={() => copy(display.iso)}>
            <span className="stats-grid__label">ISO</span>
            <strong className="stats-grid__value stats-grid__value--sm">{display.iso}</strong>
          </button>
          <button type="button" className="stats-grid__item stats-grid__item--click" onClick={() => copy(display.local)}>
            <span className="stats-grid__label">{t('Local')}</span>
            <strong className="stats-grid__value stats-grid__value--sm">{display.local}</strong>
          </button>
          <button type="button" className="stats-grid__item stats-grid__item--click" onClick={() => copy(display.utc)}>
            <span className="stats-grid__label">UTC</span>
            <strong className="stats-grid__value stats-grid__value--sm">{display.utc}</strong>
          </button>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
