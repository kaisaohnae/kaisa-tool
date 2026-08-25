'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {decodeJwt} from '@/modules/format/jwt';

export default function JwtTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const decoded = useMemo(() => {
    if (!input.trim()) return null;
    return decodeJwt(input);
  }, [input]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({type: 'ok', text: `Copied ${label}.`});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setInput('');
    setMessage(null);
  };

  return (
    <ToolPageShell
      title="JWT"
      description="Decode a JWT and inspect its header and payload (no signature verification)."
    >
      <label className="field field--block">
        <span className="field__label">{t('Token')}</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
          spellCheck={false}
          rows={6}
        />
      </label>

      <div className="tool-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => decoded?.ok && copy(decoded.payload, 'Payload')}
          disabled={!decoded?.ok}
        >
          {t('Copy Payload')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => decoded?.ok && copy(decoded.header, 'Header')}
          disabled={!decoded?.ok}
        >
          {t('Copy Header')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>

      {decoded && !decoded.ok ? <p className="tool-status tool-status--error">{t(decoded.error)}</p> : null}

      {decoded?.ok ? (
        <>
          <div className="jwt-meta">
            {decoded.alg ? <p className="tool-status">alg: {decoded.alg}</p> : null}
            {decoded.iat ? <p className="tool-status">iat: {decoded.iat}</p> : null}
            {decoded.exp ? <p className="tool-status">exp: {decoded.exp}</p> : null}
            {decoded.nbf ? <p className="tool-status">nbf: {decoded.nbf}</p> : null}
            {decoded.warnings.map(w => (
              <p key={w} className={`tool-status${decoded.unsigned ? ' tool-status--error' : ''}`}>
                {t(w)}
              </p>
            ))}
          </div>

          <div className="compare-grid">
            <label className="field field--block">
              <span className="field__label">Header</span>
              <textarea className="field__textarea field__textarea--sm" value={decoded.header} readOnly spellCheck={false} rows={10} />
            </label>
            <label className="field field--block">
              <span className="field__label">Payload</span>
              <textarea className="field__textarea field__textarea--sm" value={decoded.payload} readOnly spellCheck={false} rows={10} />
            </label>
          </div>

          <label className="field field--block">
            <span className="field__label">Signature</span>
            <textarea
              className="field__textarea field__textarea--compact"
              value={decoded.signature === '(none)' ? t('(none)') : decoded.signature}
              readOnly
              spellCheck={false}
              rows={3}
            />
          </label>
        </>
      ) : null}
    </ToolPageShell>
  );
}
