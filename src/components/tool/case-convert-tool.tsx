'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {convertCase, type CaseStyle} from '@/modules/edit/case-convert';

const STYLES: {value: CaseStyle; label: string}[] = [
  {value: 'upper', label: 'UPPER'},
  {value: 'lower', label: 'lower'},
  {value: 'title', label: 'Title Case'},
  {value: 'sentence', label: 'Sentence case'},
  {value: 'camel', label: 'camelCase'},
  {value: 'pascal', label: 'PascalCase'},
  {value: 'snake', label: 'snake_case'},
  {value: 'kebab', label: 'kebab-case'},
  {value: 'constant', label: 'CONSTANT_CASE'}
];

export default function CaseConvertTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<CaseStyle>('camel');
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const run = () => {
    if (!input.trim()) {
      setMessage({type: 'error', text: 'Enter text.'});
      return;
    }
    const result = convertCase(input, style);
    setOutput(result);
    setMessage({type: 'ok', text: 'Converted.'});
  };

  const copy = async () => {
    const text = output || input;
    if (!text.trim()) {
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

  const applyToInput = () => {
    if (!output) return;
    setInput(output);
    setMessage({type: 'ok', text: 'Applied result to the input.'});
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="Case Convert" description="Switch between uppercase, lowercase, title case, and more.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Style')}</span>
          <select
            className="field__select"
            value={style}
            onChange={e => {
              setStyle(e.target.value as CaseStyle);
              setMessage(null);
            }}
          >
            {STYLES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
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
          placeholder="hello world example"
          spellCheck={false}
          rows={10}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run} disabled={!input.trim()}>
          {t('Convert')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={applyToInput} disabled={!output}>
          {t('Apply to input')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!output.trim() && !input.trim()}>
          {t('Copy')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !output}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>

      {output !== '' ? (
        <label className="field field--block">
          <span className="field__label">{t('Result')}</span>
          <textarea className="field__textarea field__textarea--compact" value={output} readOnly spellCheck={false} rows={6} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
