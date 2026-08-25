'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {previewReplace, replaceAll, type ReplaceMode, type ReplaceOptions} from '@/modules/edit/replace';

const DEFAULT: ReplaceOptions = {
  mode: 'literal',
  find: '',
  replace: '',
  flags: {g: true, i: false, m: false, s: false}
};

type Msg = {type: 'ok' | 'error'; text: string; n?: number};

export default function ReplaceTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<ReplaceOptions>(DEFAULT);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<Msg | null>(null);

  const preview = useMemo(() => previewReplace(input, options), [input, options]);

  const patchFlag = (key: keyof ReplaceOptions['flags'], value: boolean) => {
    setOptions(prev => ({...prev, flags: {...prev.flags, [key]: value}}));
    setMessage(null);
  };

  const showMsg = (msg: Msg) =>
    msg.n != null ? t(msg.text).replace('{n}', String(msg.n)) : t(msg.text);

  const run = () => {
    if (!input) {
      setMessage({type: 'error', text: 'Enter text.'});
      return;
    }
    const result = replaceAll(input, options);
    if (result.error) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setOutput(result.output);
    setMessage(
      result.matchCount === 0
        ? {type: 'ok', text: 'No matches.'}
        : {type: 'ok', text: 'Replaced {n} matches.', n: result.matchCount}
    );
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

  const applyToInput = () => {
    if (output === '') return;
    setInput(output);
    setMessage({type: 'ok', text: 'Applied result to the input.'});
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="Find & Replace" description="Find and replace using plain text or regular expressions.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Mode')}</span>
          <select
            className="field__select"
            value={options.mode}
            onChange={e => {
              setOptions(prev => ({...prev, mode: e.target.value as ReplaceMode}));
              setMessage(null);
            }}
          >
            <option value="literal">{t('Literal')}</option>
            <option value="regex">{t('Regex')}</option>
          </select>
        </label>
        <label className="field" style={{minWidth: 200, flex: 1}}>
          <span className="field__label">{t('Find')}</span>
          <input
            className="field__input"
            value={options.find}
            onChange={e => {
              setOptions(prev => ({...prev, find: e.target.value}));
              setMessage(null);
            }}
            placeholder={options.mode === 'regex' ? '\\d+' : t('Text to find')}
            spellCheck={false}
          />
        </label>
        <label className="field" style={{minWidth: 200, flex: 1}}>
          <span className="field__label">{t('Replace')}</span>
          <input
            className="field__input"
            value={options.replace}
            onChange={e => {
              setOptions(prev => ({...prev, replace: e.target.value}));
              setMessage(null);
            }}
            placeholder={t('Replacement text')}
            spellCheck={false}
          />
        </label>
        {options.mode === 'regex' ? (
          <>
            <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
              <input type="checkbox" checked={options.flags.g} onChange={e => patchFlag('g', e.target.checked)} />
              <span className="field__label">g</span>
            </label>
            <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
              <input type="checkbox" checked={options.flags.i} onChange={e => patchFlag('i', e.target.checked)} />
              <span className="field__label">i</span>
            </label>
            <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
              <input type="checkbox" checked={options.flags.m} onChange={e => patchFlag('m', e.target.checked)} />
              <span className="field__label">m</span>
            </label>
            <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
              <input type="checkbox" checked={options.flags.s} onChange={e => patchFlag('s', e.target.checked)} />
              <span className="field__label">s</span>
            </label>
          </>
        ) : (
          <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
            <input type="checkbox" checked={options.flags.i} onChange={e => patchFlag('i', e.target.checked)} />
            <span className="field__label">{t('Ignore case')}</span>
          </label>
        )}
        <p className={`tool-status${preview.error ? ' tool-status--error' : ''}`}>
          {preview.error
            ? t(preview.error)
            : t('{n} matches').replace('{n}', String(preview.matchCount))}
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
          placeholder={t('Enter text here')}
          spellCheck={false}
          rows={12}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run} disabled={!input || !options.find}>
          {t('Replace all')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={applyToInput} disabled={output === ''}>
          {t('Apply to input')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!output && !input}>
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
