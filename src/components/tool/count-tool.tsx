'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {countText} from '@/modules/edit/count';

export default function CountTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);
  const stats = useMemo(() => countText(input), [input]);

  const copy = async () => {
    if (!input) {
      setMessage({type: 'error', text: 'No content to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(input);
      setMessage({type: 'ok', text: 'Copied to clipboard.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setInput('');
    setMessage(null);
  };

  const items = [
    {label: 'Characters', value: stats.chars},
    {label: 'Characters (no spaces)', value: stats.charsNoSpaces},
    {label: 'Words', value: stats.words},
    {label: 'Lines', value: stats.lines},
    {label: 'Bytes (UTF-8)', value: stats.bytes},
    {label: 'Sentences (approx.)', value: stats.sentences}
  ];

  return (
    <ToolPageShell title="Word Count" description="See character, word, line, and byte counts as you type.">
      <div className="stats-grid">
        {items.map(item => (
          <div key={item.label} className="stats-grid__item">
            <span className="stats-grid__label">{t(item.label)}</span>
            <strong className="stats-grid__value">{item.value.toLocaleString()}</strong>
          </div>
        ))}
      </div>

      <label className="field field--block">
        <span className="field__label">{t('Input')}</span>
        <textarea
          className="field__textarea"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder={t('Enter text here')}
          spellCheck={false}
          rows={14}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!input}>
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
