'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {csvToJson, jsonToCsv} from '@/modules/format/csv-json';

type Mode = 'csv-to-json' | 'json-to-csv';

export default function CsvJsonTool() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('csv-to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [header, setHeader] = useState(true);
  const [delimiter, setDelimiter] = useState(',');
  const [pretty, setPretty] = useState(true);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const convert = () => {
    if (mode === 'csv-to-json') {
      const result = csvToJson(input, {header, delimiter, pretty, indent: 2});
      if (!result.ok) {
        setMessage({type: 'error', text: result.error});
        return;
      }
      setOutput(result.result);
      setMessage({type: 'ok', text: 'Converted to JSON.'});
      return;
    }

    const result = jsonToCsv(input, {delimiter, header});
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setOutput(result.result);
    setMessage({type: 'ok', text: 'Converted to CSV.'});
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
    setMode(mode === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
    setMessage(null);
  };

  return (
    <ToolPageShell title="CSV ↔ JSON" description="Convert CSV to JSON or JSON to CSV.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Mode')}</span>
          <select
            className="field__select"
            value={mode}
            onChange={e => {
              setMode(e.target.value as Mode);
              setMessage(null);
            }}
          >
            <option value="csv-to-json">CSV → JSON</option>
            <option value="json-to-csv">JSON → CSV</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Separator')}</span>
          <select
            className="field__select"
            value={delimiter}
            onChange={e => {
              setDelimiter(e.target.value);
              setMessage(null);
            }}
          >
            <option value=",">{t('Comma (,)')}</option>
            <option value=";">{t('Semicolon (;)')}</option>
            <option value={'\t'}>{t('Tab')}</option>
            <option value="|">{t('Pipe (|)')}</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={header}
            onChange={e => {
              setHeader(e.target.checked);
              setMessage(null);
            }}
          />
          <span className="field__label">
            {mode === 'csv-to-json' ? t('First row as header') : t('Include header')}
          </span>
        </label>
        {mode === 'csv-to-json' ? (
          <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
            <input
              type="checkbox"
              checked={pretty}
              onChange={e => {
                setPretty(e.target.checked);
                setMessage(null);
              }}
            />
            <span className="field__label">{t('Pretty JSON')}</span>
          </label>
        ) : null}
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
          placeholder={
            mode === 'csv-to-json'
              ? 'name,age\nAlice,30\nBob,25'
              : '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]'
          }
          spellCheck={false}
          rows={12}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={convert} disabled={!input.trim()}>
          {t('Convert')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={swap} disabled={!output}>
          {t('Result → input · switch mode')}
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
          rows={12}
          placeholder={t('Result appears here')}
        />
      </label>
    </ToolPageShell>
  );
}
