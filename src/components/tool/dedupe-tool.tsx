'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {dedupeText, type DedupeOptions, type DedupeSeparator} from '@/modules/edit/dedupe';

const DEFAULT_OPTIONS: DedupeOptions = {
  separator: 'newline',
  trim: true,
  ignoreCase: false,
  ignoreEmpty: true,
  sort: false
};

export default function DedupeTool() {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<DedupeOptions>(DEFAULT_OPTIONS);
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<{originalCount: number; uniqueCount: number; removedCount: number} | null>(null);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const charCount = useMemo(() => input.length, [input]);

  const patch = <K extends keyof DedupeOptions>(key: K, value: DedupeOptions[K]) => {
    setOptions(prev => ({...prev, [key]: value}));
    setMessage(null);
  };

  const run = () => {
    if (!input.trim()) {
      setMessage({type: 'error', text: '내용을 입력하세요.'});
      return;
    }
    const result = dedupeText(input, options);
    setOutput(result.output);
    setStats({
      originalCount: result.originalCount,
      uniqueCount: result.uniqueCount,
      removedCount: result.removedCount
    });
    setMessage({
      type: 'ok',
      text: result.removedCount === 0 ? '중복이 없습니다.' : `${result.removedCount}개 중복을 제거했습니다.`
    });
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

  const applyToInput = () => {
    if (!output) return;
    setInput(output);
    setMessage({type: 'ok', text: '결과를 입력란에 반영했습니다.'});
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setStats(null);
    setMessage(null);
  };

  return (
    <ToolPageShell title="중복제거" description="구분 단위로 나눈 뒤 중복을 제거하고 순서를 유지하거나 정렬합니다.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">구분</span>
          <select
            className="field__select"
            value={options.separator}
            onChange={e => patch('separator', e.target.value as DedupeSeparator)}
          >
            <option value="newline">줄바꿈</option>
            <option value="comma">쉼표 (,)</option>
            <option value="semicolon">세미콜론 (;)</option>
            <option value="space">공백</option>
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.trim} onChange={e => patch('trim', e.target.checked)} />
          <span className="field__label">앞뒤 공백 제거</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreCase} onChange={e => patch('ignoreCase', e.target.checked)} />
          <span className="field__label">대소문자 무시</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreEmpty} onChange={e => patch('ignoreEmpty', e.target.checked)} />
          <span className="field__label">빈 항목 무시</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.sort} onChange={e => patch('sort', e.target.checked)} />
          <span className="field__label">결과 정렬</span>
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
          placeholder={'apple\nbanana\napple\norange'}
          spellCheck={false}
          rows={12}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run} disabled={!input.trim()}>
          중복 제거
        </button>
        <button type="button" className="btn btn--ghost" onClick={applyToInput} disabled={!output}>
          결과에 반영
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!output.trim() && !input.trim()}>
          복사
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input && !output}>
          비우기
        </button>
        {stats ? (
          <p className="tool-status">
            원본 {stats.originalCount} · 유일 {stats.uniqueCount} · 제거 {stats.removedCount}
          </p>
        ) : null}
        {message ? <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{message.text}</p> : null}
      </div>

      {output !== '' || stats ? (
        <label className="field field--block">
          <span className="field__label">결과</span>
          <textarea className="field__textarea" value={output} readOnly spellCheck={false} rows={12} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
