'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {testRegex, type RegexFlags} from '@/modules/edit/regex';

const DEFAULT_FLAGS: RegexFlags = {g: true, i: false, m: false, s: false};

export default function RegexTool() {
  const t = useT();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<RegexFlags>(DEFAULT_FLAGS);
  const [text, setText] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const result = useMemo(() => testRegex(pattern, flags, text, replaceWith), [pattern, flags, text, replaceWith]);

  const patchFlag = (key: keyof RegexFlags, value: boolean) => {
    setFlags(prev => ({...prev, [key]: value}));
    setMessage(null);
  };

  const copy = async () => {
    if (!result.replacePreview && !text) {
      setMessage({type: 'error', text: 'No content to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(result.replacePreview);
      setMessage({type: 'ok', text: 'Replace preview copied.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setPattern('');
    setText('');
    setReplaceWith('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="Regex" description="Test a pattern and inspect matches, groups, and replace preview.">
      <div className="tool-controls">
        <label className="field" style={{minWidth: 240, flex: 1}}>
          <span className="field__label">{t('Pattern')}</span>
          <input
            className="field__input"
            value={pattern}
            onChange={e => {
              setPattern(e.target.value);
              setMessage(null);
            }}
            placeholder="(\\w+)@(\\w+\\.\\w+)"
            spellCheck={false}
          />
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={flags.g} onChange={e => patchFlag('g', e.target.checked)} />
          <span className="field__label">g</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={flags.i} onChange={e => patchFlag('i', e.target.checked)} />
          <span className="field__label">i</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={flags.m} onChange={e => patchFlag('m', e.target.checked)} />
          <span className="field__label">m</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={flags.s} onChange={e => patchFlag('s', e.target.checked)} />
          <span className="field__label">s</span>
        </label>
        <p className={`tool-status${result.error ? ' tool-status--error' : result.ok ? ' tool-status--ok' : ''}`}>
          {result.error
            ? t(result.error)
            : t('{n} matches').replace('{n}', String(result.matchCount))}
        </p>
      </div>

      <label className="field field--block">
        <span className="field__label">{t('Test string')}</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={text}
          onChange={e => {
            setText(e.target.value);
            setMessage(null);
          }}
          placeholder={t('Test text')}
          spellCheck={false}
          rows={8}
        />
      </label>

      <label className="field field--block">
        <span className="field__label">{t('Replacement')}</span>
        <input
          className="field__input"
          value={replaceWith}
          onChange={e => {
            setReplaceWith(e.target.value);
            setMessage(null);
          }}
          placeholder="$1"
          spellCheck={false}
        />
      </label>

      {result.ok && result.matches.length > 0 ? (
        <div className="match-list">
          <p className="field__label">{t('Match list')}</p>
          <ul className="match-list__items">
            {result.matches.map((m, i) => (
              <li key={`${m.index}-${i}`} className="match-list__item">
                <span className="match-list__index">#{i + 1}</span>
                <code className="match-list__match">{m.match}</code>
                <span className="match-list__meta">index {m.index}</span>
                {m.groups.length > 0 ? (
                  <span className="match-list__meta">groups: [{m.groups.map(g => JSON.stringify(g)).join(', ')}]</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.ok && pattern ? (
        <label className="field field--block">
          <span className="field__label">{t('Replace preview')}</span>
          <textarea
            className="field__textarea field__textarea--compact"
            value={result.replacePreview}
            readOnly
            spellCheck={false}
            rows={6}
          />
        </label>
      ) : null}

      <div className="tool-actions">
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!pattern}>
          {t('Copy preview')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!pattern && !text && !replaceWith}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
