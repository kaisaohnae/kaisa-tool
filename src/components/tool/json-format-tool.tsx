'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {formatAndValidateJson, minifyJson, type JsonIndentStyle} from '@/modules/format/json';

export default function JsonFormatTool() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<JsonIndentStyle>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const charCount = useMemo(() => input.length, [input]);
  const options = useMemo(() => ({indent, sortKeys}), [indent, sortKeys]);

  const validateOnly = () => {
    const result = formatAndValidateJson(input, options);
    if (result.ok) {
      setMessage({type: 'ok', text: '유효한 JSON입니다.'});
      return;
    }
    const loc = result.line ? ` (줄 ${result.line}, 열 ${result.column})` : '';
    setMessage({type: 'error', text: `${result.error}${loc}`});
  };

  const format = () => {
    const result = formatAndValidateJson(input, options);
    if (!result.ok) {
      const loc = result.line ? ` (줄 ${result.line}, 열 ${result.column})` : '';
      setMessage({type: 'error', text: `${result.error}${loc}`});
      return;
    }
    setInput(result.formatted);
    setOutput(result.formatted);
    setMessage({type: 'ok', text: sortKeys ? '키 정렬 후 포맷했습니다.' : '정렬했습니다.'});
  };

  const minify = () => {
    const result = minifyJson(input, sortKeys);
    if (!result.ok) {
      const loc = result.line ? ` (줄 ${result.line}, 열 ${result.column})` : '';
      setMessage({type: 'error', text: `${result.error}${loc}`});
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
    <ToolPageShell title="JSON" description="문자열을 붙여 넣고 유효성을 검사하거나, 정렬 패턴에 맞게 포맷합니다.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">들여쓰기</span>
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
          <span className="field__label">키 알파벳 정렬</span>
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
          placeholder='{"name":"kaisa","tools":["image","pdf"]}'
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
