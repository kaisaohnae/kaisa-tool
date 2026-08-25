'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {generateUuids} from '@/modules/util/uuid';

type Msg = {type: 'ok' | 'error'; text: string; n?: number};

export default function UuidTool() {
  const t = useT();
  const [count, setCount] = useState(5);
  const [nil, setNil] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uppercase, setUppercase] = useState(false);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState<Msg | null>(null);

  const showMsg = (msg: Msg) =>
    msg.n != null ? t(msg.text).replace('{n}', String(msg.n)) : t(msg.text);

  const run = () => {
    const list = generateUuids({count, nil, hyphens, uppercase});
    setOutput(list.join('\n'));
    setMessage({type: 'ok', text: 'Generated {n}.', n: list.length});
  };

  const copy = async () => {
    if (!output.trim()) {
      setMessage({type: 'error', text: 'No content to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage({type: 'ok', text: 'Copied to clipboard.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setOutput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="UUID" description="Generate one or more UUIDs.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Count')}</span>
          <input
            className="field__input"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
          />
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={nil} onChange={e => setNil(e.target.checked)} />
          <span className="field__label">Nil UUID</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={hyphens} onChange={e => setHyphens(e.target.checked)} />
          <span className="field__label">{t('Hyphenated')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} />
          <span className="field__label">{t('Uppercase')}</span>
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={run}>
          {t('Generate')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={copy} disabled={!output.trim()}>
          {t('Copy')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!output}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {showMsg(message)}
          </p>
        ) : null}
      </div>

      {output ? (
        <label className="field field--block">
          <span className="field__label">{t('Result')}</span>
          <textarea className="field__textarea field__textarea--compact" value={output} readOnly spellCheck={false} rows={10} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
