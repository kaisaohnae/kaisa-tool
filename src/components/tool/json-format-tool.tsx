'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {formatAndValidateJson, minifyJson, type JsonIndentStyle} from '@/modules/format/json';

export default function JsonFormatTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<JsonIndentStyle>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string; detail?: string} | null>(null);

  const charCount = useMemo(() => input.length, [input]);
  const options = useMemo(() => ({indent, sortKeys}), [indent, sortKeys]);

  const errorDetail = (line?: number, column?: number) =>
    line ? ` (${t('line')} ${line}, ${t('column')} ${column})` : undefined;

  const validateOnly = () => {
    const result = formatAndValidateJson(input, options);
    if (result.ok) {
      setMessage({type: 'ok', text: 'Valid JSON.'});
      return;
    }
    setMessage({type: 'error', text: result.error, detail: errorDetail(result.line, result.column)});
  };

  const format = () => {
    const result = formatAndValidateJson(input, options);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error, detail: errorDetail(result.line, result.column)});
      return;
    }
    setInput(result.formatted);
    setOutput(result.formatted);
    setMessage({type: 'ok', text: sortKeys ? 'Formatted with sorted keys.' : 'Formatted.'});
  };

  const minify = () => {
    const result = minifyJson(input, sortKeys);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error, detail: errorDetail(result.line, result.column)});
      return;
    }
    setInput(result.formatted);
    setOutput(result.formatted);
    setMessage({type: 'ok', text: 'Minified.'});
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

  const clear = () => {
    setInput('');
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="JSON" description="Paste a string to validate or format JSON with your preferred style.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Indent')}</span>
          <select
            className="field__select"
            value={indent}
            onChange={e => {
              setIndent(e.target.value as JsonIndentStyle);
              setMessage(null);
            }}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={e => {
              setSortKeys(e.target.checked);
              setMessage(null);
            }}
          />
          <span className="field__label">{t('Sort keys')}</span>
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
          placeholder='{"name":"kaisa","tools":["image","pdf"]}'
          spellCheck={false}
          rows={16}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={format} disabled={!input.trim()}>
          {t('Format')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={validateOnly} disabled={!input.trim()}>
          {t('Validate')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={minify} disabled={!input.trim()}>
          {t('Minify')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!input.trim() && !output.trim()}>
          {t('Copy')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !output}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {t(message.text)}
            {message.detail}
          </p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
