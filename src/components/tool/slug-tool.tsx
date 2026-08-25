'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {slugify, type HangulMode} from '@/modules/edit/slug';

export default function SlugTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState('-');
  const [hangul, setHangul] = useState<HangulMode>('romanize');
  const [maxLength, setMaxLength] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const output = useMemo(() => {
    const max = maxLength.trim() === '' ? undefined : Number(maxLength);
    return slugify(input, {
      separator: separator || '-',
      hangul,
      maxLength: Number.isFinite(max) ? max : undefined
    });
  }, [input, separator, hangul, maxLength]);

  const copy = async () => {
    if (!output) {
      setMessage({type: 'error', text: 'No content to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage({type: 'ok', text: 'Copied to clipboard.'});
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
      title="Slug"
      description="Build a URL slug. Choose how non-Latin characters are kept, removed, or romanized."
    >
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Separator')}</span>
          <input
            className="field__input"
            value={separator}
            onChange={e => {
              setSeparator(e.target.value.slice(0, 3) || '-');
              setMessage(null);
            }}
            style={{width: 80}}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Non-Latin handling')}</span>
          <select
            className="field__select"
            value={hangul}
            onChange={e => {
              setHangul(e.target.value as HangulMode);
              setMessage(null);
            }}
          >
            <option value="romanize">{t('Romanize')}</option>
            <option value="keep">{t('Keep non-Latin')}</option>
            <option value="remove">{t('Remove non-Latin')}</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Max length')}</span>
          <input
            className="field__input"
            type="number"
            min={1}
            placeholder={t('No limit')}
            value={maxLength}
            onChange={e => {
              setMaxLength(e.target.value);
              setMessage(null);
            }}
          />
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
          placeholder="Hello World!"
          spellCheck={false}
          rows={5}
        />
      </label>

      <label className="field field--block">
        <span className="field__label">{t('Slug')}</span>
        <input className="field__input" value={output} readOnly spellCheck={false} />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={copy} disabled={!output}>
          {t('Copy')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
