'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {decodeBase64, encodeBase64} from '@/modules/format/base64';

export default function Base64Tool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const encode = () => {
    if (!input) {
      setMessage({type: 'error', text: 'Enter text.'});
      return;
    }
    const result = encodeBase64(input);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setOutput(result.result);
    setMessage({type: 'ok', text: 'Encoded as Base64.'});
  };

  const decode = () => {
    const result = decodeBase64(input);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setOutput(result.result);
    setMessage({type: 'ok', text: 'Decoded Base64.'});
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
    <ToolPageShell title="Base64" description="Encode or decode text with Base64. Processing stays in the browser.">
      <label className="field field--block">
        <span className="field__label">{t('Input')}</span>
        <textarea
          className="field__textarea"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder={t('Text to encode or Base64 string')}
          spellCheck={false}
          rows={10}
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
          className="field__textarea"
          value={output}
          readOnly
          spellCheck={false}
          rows={10}
          placeholder={t('Result appears here')}
        />
      </label>
    </ToolPageShell>
  );
}
