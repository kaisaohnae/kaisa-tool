'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {
  DEFAULT_SQL_OPTIONS,
  formatSql,
  minifySql,
  validateSqlLite,
  type SqlDialect,
  type SqlFormatOptions,
  type SqlKeywordCase
} from '@/modules/format/sql';

export default function SqlFormatTool() {
  const t = useT();
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<SqlFormatOptions>(DEFAULT_SQL_OPTIONS);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const charCount = useMemo(() => input.length, [input]);

  const patch = <K extends keyof SqlFormatOptions>(key: K, value: SqlFormatOptions[K]) => {
    setOptions(prev => ({...prev, [key]: value}));
    setMessage(null);
  };

  const validateOnly = () => {
    const result = validateSqlLite(input);
    if (result.ok) {
      setMessage({type: 'ok', text: 'Basic validation passed (quotes and parentheses).'});
      return;
    }
    setMessage({type: 'error', text: result.error});
  };

  const format = () => {
    const result = formatSql(input, options);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setInput(result.formatted);
    setOutput(result.formatted);
    setMessage({type: 'ok', text: 'Formatted.'});
  };

  const minify = () => {
    const result = minifySql(input);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
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
    <ToolPageShell title="SQL" description="Format SQL statements and tweak indentation and keyword case.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Dialect')}</span>
          <select className="field__select" value={options.dialect} onChange={e => patch('dialect', e.target.value as SqlDialect)}>
            <option value="sql">Standard SQL</option>
            <option value="mysql">MySQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
            <option value="transactsql">T-SQL</option>
            <option value="plsql">PL/SQL</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Keywords')}</span>
          <select className="field__select" value={options.keywordCase} onChange={e => patch('keywordCase', e.target.value as SqlKeywordCase)}>
            <option value="upper">UPPER</option>
            <option value="lower">lower</option>
            <option value="preserve">{t('Preserve')}</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Indent')}</span>
          <select
            className="field__select"
            value={options.useTabs ? 'tab' : String(options.tabWidth)}
            onChange={e => {
              const v = e.target.value;
              if (v === 'tab') {
                setOptions(prev => ({...prev, useTabs: true, tabWidth: 2}));
              } else {
                setOptions(prev => ({...prev, useTabs: false, tabWidth: Number(v) as 2 | 4}));
              }
              setMessage(null);
            }}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Query spacing')}</span>
          <select
            className="field__select"
            value={options.linesBetweenQueries}
            onChange={e => patch('linesBetweenQueries', Number(e.target.value) as 0 | 1 | 2)}
          >
            <option value={0}>{t('0 lines')}</option>
            <option value={1}>{t('1 line')}</option>
            <option value={2}>{t('2 lines')}</option>
          </select>
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
          placeholder={'SELECT id, name FROM users WHERE active = 1 ORDER BY name;'}
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
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
