'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {generateLorem, type LoremLang, type LoremMode} from '@/modules/util/lorem';

export default function LoremTool() {
  const [mode, setMode] = useState<LoremMode>('paragraphs');
  const [lang, setLang] = useState<LoremLang>('mixed');
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const run = () => {
    const text = generateLorem({mode, lang, count});
    setOutput(text);
    setMessage({type: 'ok', text: '생성했습니다.'});
  };

  const copy = async () => {
    if (!output.trim()) {
      setMessage({type: 'error', text: '복사할 내용이 없습니다.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage({type: 'ok', text: '클립보드에 복사했습니다.'});
    } catch {
      setMessage({type: 'error', text: '복사에 실패했습니다.'});
    }
  };

  const clear = () => {
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="더미 텍스트" description="레이아웃용 라틴·한글 더미 문단·문장·단어를 만듭니다.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">단위</span>
          <select className="field__select" value={mode} onChange={e => setMode(e.target.value as LoremMode)}>
            <option value="paragraphs">문단</option>
            <option value="sentences">문장</option>
            <option value="words">단어</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">언어</span>
          <select className="field__select" value={lang} onChange={e => setLang(e.target.value as LoremLang)}>
            <option value="mixed">혼합</option>
            <option value="latin">라틴</option>
            <option value="korean">한글</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">개수</span>
          <input
            className="field__input"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run}>
          생성
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!output.trim()}>
          복사
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!output}>
          비우기
        </button>
        {message ? <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{message.text}</p> : null}
      </div>

      {output ? (
        <label className="field field--block">
          <span className="field__label">결과</span>
          <textarea className="field__textarea" value={output} readOnly spellCheck={false} rows={14} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
