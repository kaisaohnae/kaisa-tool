'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {dedupeText, type DedupeOptions, type DedupeSeparator} from '@/modules/edit/dedupe';

const DEFAULT_OPTIONS: DedupeOptions = {
  separator: 'newline',
  trim: true,
  ignoreCase: false,
  ignoreEmpty: true,
  sort: false
};

type Msg = {type: 'ok' | 'error'; text: string; n?: number};

export default function DedupeTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<DedupeOptions>(DEFAULT_OPTIONS);
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<{originalCount: number; uniqueCount: number; removedCount: number} | null>(null);
  const [message, setMessage] = useState<Msg | null>(null);

  const charCount = useMemo(() => input.length, [input]);

  const patch = <K extends keyof DedupeOptions>(key: K, value: DedupeOptions[K]) => {
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
    const result = dedupeText(input, options);
    setOutput(result.output);
    setStats({
      originalCount: result.originalCount,
      uniqueCount: result.uniqueCount,
      removedCount: result.removedCount
    });
    setMessage(
      result.removedCount === 0
        ? {type: 'ok', text: 'No duplicates.'}
        : {type: 'ok', text: 'Removed {n} duplicates.', n: result.removedCount}
    );
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
    setStats(null);
    setMessage(null);
  };

  return (
    <ToolPageShell title="Deduplicate" description="Remove duplicate lines from text.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Separator')}</span>
          <select
            className="field__select"
            value={options.separator}
            onChange={e => patch('separator', e.target.value as DedupeSeparator)}
          >
            <option value="newline">{t('Newline')}</option>
            <option value="comma">{t('Comma (,)')}</option>
            <option value="semicolon">{t('Semicolon (;)')}</option>
            <option value="space">{t('Space')}</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.trim} onChange={e => patch('trim', e.target.checked)} />
          <span className="field__label">{t('Trim lines')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreCase} onChange={e => patch('ignoreCase', e.target.checked)} />
          <span className="field__label">{t('Ignore case')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreEmpty} onChange={e => patch('ignoreEmpty', e.target.checked)} />
          <span className="field__label">{t('Ignore empty items')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.sort} onChange={e => patch('sort', e.target.checked)} />
          <span className="field__label">{t('Sort result')}</span>
        </label>
        <p className="tool-status">
          {charCount.toLocaleString()} {t('Characters')}
        </p>
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
          placeholder={'apple\nbanana\napple\norange'}
          spellCheck={false}
          rows={12}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run} disabled={!input.trim()}>
          {t('Remove duplicates')}
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
        {stats ? (
          <p className="tool-status">
            {t('Original')} {stats.originalCount} · {t('Unique')} {stats.uniqueCount} · {t('Removed')}{' '}
            {stats.removedCount}
          </p>
        ) : null}
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {showMsg(message)}
          </p>
        ) : null}
      </div>

      {output !== '' || stats ? (
        <label className="field field--block">
          <span className="field__label">{t('Result')}</span>
          <textarea className="field__textarea" value={output} readOnly spellCheck={false} rows={12} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
