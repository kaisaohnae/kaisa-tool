'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
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
      setMessage({type: 'ok', text: '기본 유효성 검사 통과 (따옴표·괄호).'});
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
    setMessage({type: 'ok', text: '정렬했습니다.'});
  };

  const minify = () => {
    const result = minifySql(input);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    setInput(result.formatted);
    setOutput(result.formatted);
    setMessage({type: 'ok', text: '한 줄로 압축했습니다.'});
  };

  const copy = async () => {
    const text = output || input;
    if (!text.trim()) {
      setMessage({type: 'error', text: '복사할 내용이 없습니다.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMessage({type: 'ok', text: '클립보드에 복사했습니다.'});
    } catch {
      setMessage({type: 'error', text: '복사에 실패했습니다.'});
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="SQL" description="SQL을 붙여 넣고 방언·키워드 대소문자·들여쓰기 패턴에 맞게 정렬합니다.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">방언</span>
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
          <span className="field__label">키워드</span>
          <select className="field__select" value={options.keywordCase} onChange={e => patch('keywordCase', e.target.value as SqlKeywordCase)}>
            <option value="upper">UPPER</option>
            <option value="lower">lower</option>
            <option value="preserve">유지</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">들여쓰기</span>
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
          <span className="field__label">쿼리 간격</span>
          <select
            className="field__select"
            value={options.linesBetweenQueries}
            onChange={e => patch('linesBetweenQueries', Number(e.target.value) as 0 | 1 | 2)}
          >
            <option value={0}>0줄</option>
            <option value={1}>1줄</option>
            <option value={2}>2줄</option>
          </select>
        </label>
        <p className="tool-status">{charCount.toLocaleString()}자</p>
      </div>

      <label className="field field--block">
        <span className="field__label">입력</span>
        <textarea
          className="field__textarea"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setMessage(null);
          }}
          placeholder={"SELECT id, name FROM users WHERE active = 1 ORDER BY name;"}
          spellCheck={false}
          rows={16}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={format} disabled={!input.trim()}>
          정렬
        </button>
        <button type="button" className="btn btn--ghost" onClick={validateOnly} disabled={!input.trim()}>
          유효 체크
        </button>
        <button type="button" className="btn btn--ghost" onClick={minify} disabled={!input.trim()}>
          압축
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!input.trim() && !output.trim()}>
          복사
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !output}>
          비우기
        </button>
        {message ? <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{message.text}</p> : null}
      </div>
    </ToolPageShell>
  );
}
