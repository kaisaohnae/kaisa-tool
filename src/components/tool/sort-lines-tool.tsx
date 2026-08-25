'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {sortLines, type SortLinesOptions, type SortMode} from '@/modules/edit/sort-lines';

const DEFAULT_OPTIONS: SortLinesOptions = {
  mode: 'locale',
  reverse: false,
  unique: false,
  trim: true,
  ignoreEmpty: true,
  ignoreCase: false
};

type Msg = {type: 'ok' | 'error'; text: string; n?: number};

export default function SortLinesTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<SortLinesOptions>(DEFAULT_OPTIONS);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<Msg | null>(null);

  const patch = <K extends keyof SortLinesOptions>(key: K, value: SortLinesOptions[K]) => {
    setOptions(prev => ({...prev, [key]: value}));
    setMessage(null);
  };

  const showMsg = (msg: Msg) =>
    msg.n != null ? t(msg.text).replace('{n}', String(msg.n)) : t(msg.text);

  const run = () => {
    if (!input.trim()) {
      setMessage({type: 'error', text: 'Enter text.'});
      return;
    }
    const result = sortLines(input, options);
    setOutput(result.output);
    setMessage({type: 'ok', text: 'Sorted {n} lines.', n: result.lineCount});
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
    <ToolPageShell title="Sort Lines" description="Sort lines and clean duplicates or blank lines.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Sort by')}</span>
          <select
            className="field__select"
            value={options.mode}
            onChange={e => patch('mode', e.target.value as SortMode)}
          >
            <option value="locale">{t('Alphabetical')}</option>
            <option value="numeric">{t('Numeric')}</option>
            <option value="length">{t('Length')}</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.reverse} onChange={e => patch('reverse', e.target.checked)} />
          <span className="field__label">{t('Reverse')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.unique} onChange={e => patch('unique', e.target.checked)} />
          <span className="field__label">{t('Remove duplicates')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.trim} onChange={e => patch('trim', e.target.checked)} />
          <span className="field__label">{t('Trim lines')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreEmpty} onChange={e => patch('ignoreEmpty', e.target.checked)} />
          <span className="field__label">{t('Ignore blank lines')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreCase} onChange={e => patch('ignoreCase', e.target.checked)} />
          <span className="field__label">{t('Ignore case')}</span>
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
          placeholder={'banana\napple\nCherry\napple'}
          spellCheck={false}
          rows={12}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run} disabled={!input.trim()}>
          {t('Sort')}
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
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {showMsg(message)}
          </p>
        ) : null}
      </div>

      {output !== '' ? (
        <label className="field field--block">
          <span className="field__label">{t('Result')}</span>
          <textarea className="field__textarea" value={output} readOnly spellCheck={false} rows={12} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
