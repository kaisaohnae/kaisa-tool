'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {decodeUrl, encodeUrl, type UrlCodecMode} from '@/modules/format/url-codec';

export default function UrlCodecTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<UrlCodecMode>('component');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const encode = () => {
    const result = encodeUrl(input, mode);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setOutput(result.result);
    setMessage({type: 'ok', text: mode === 'full' ? 'Encoded full URL.' : 'Encoded component.'});
  };

  const decode = () => {
    const result = decodeUrl(input, mode);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setOutput(result.result);
    setMessage({type: 'ok', text: 'Decoded.'});
  };

  const copy = async () => {
    const text = output || input;
    if (!text) {
      setMessage({type: 'error', text: 'No content to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMessage({type: 'ok', text: 'Copied to clipboard.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setMessage(null);
  };

  const swap = () => {
    setInput(output);
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell
      title="URL"
      description="Percent-encode or decode a URL or query value (encodeURIComponent / encodeURI)."
    >
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Mode')}</span>
          <select
            className="field__select"
            value={mode}
            onChange={e => {
              setMode(e.target.value as UrlCodecMode);
              setMessage(null);
            }}
          >
            <option value="component">{t('Component (encodeURIComponent)')}</option>
            <option value="full">{t('Full URL (encodeURI)')}</option>
          </select>
        </label>
      </div>

      <label className="field field--block">
        <span className="field__label">{t('Input')}</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder={mode === 'full' ? 'https://example.com/path?q=value' : t('Search term / path / query value')}
          spellCheck={false}
          rows={6}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={encode} disabled={!input}>
          {t('Encode')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={decode} disabled={!input.trim()}>
          {t('Decode')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={swap} disabled={!output}>
          {t('Result → input')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!input && !output}>
          {t('Copy')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !output}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>

      <label className="field field--block">
        <span className="field__label">{t('Result')}</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={output}
          readOnly
          spellCheck={false}
          rows={6}
          placeholder={t('Result appears here')}
        />
      </label>
    </ToolPageShell>
  );
}
