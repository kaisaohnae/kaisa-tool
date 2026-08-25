'use client';

import {useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {
  generatePasswords,
  STRENGTH_LABEL,
  type PasswordCharset,
  type PasswordOptions
} from '@/modules/util/password';

const DEFAULT_CHARSET: PasswordCharset = {
  upper: true,
  lower: true,
  digit: true,
  symbol: true,
  excludeSimilar: true
};

type Msg = {type: 'ok' | 'error'; text: string; n?: number};

export default function PasswordTool() {
  const t = useT();
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(5);
  const [charset, setCharset] = useState<PasswordCharset>(DEFAULT_CHARSET);
  const [output, setOutput] = useState('');
  const [meta, setMeta] = useState<{strength: string; entropyBits: number} | null>(null);
  const [message, setMessage] = useState<Msg | null>(null);

  const patchCharset = (key: keyof PasswordCharset, value: boolean) => {
    setCharset(prev => ({...prev, [key]: value}));
    setMessage(null);
  };

  const showMsg = (msg: Msg) =>
    msg.n != null ? t(msg.text).replace('{n}', String(msg.n)) : t(msg.text);

  const run = () => {
    const options: PasswordOptions = {length, count, charset};
    const result = generatePasswords(options);
    if (result.error) {
      setMessage({type: 'error', text: result.error});
      setOutput('');
      setMeta(null);
      return;
    }
    setOutput(result.passwords.join('\n'));
    setMeta({strength: STRENGTH_LABEL[result.strength], entropyBits: result.entropyBits});
    setMessage({type: 'ok', text: 'Generated {n}.', n: result.passwords.length});
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
    setMeta(null);
    setMessage(null);
  };

  return (
    <ToolPageShell
      title="Password"
      description="Create a strong password with browser randomness. Nothing is sent to a server."
    >
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Length')}</span>
          <input
            className="field__input"
            type="number"
            min={4}
            max={128}
            value={length}
            onChange={e => setLength(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Count')}</span>
          <input
            className="field__input"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
          />
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={charset.upper} onChange={e => patchCharset('upper', e.target.checked)} />
          <span className="field__label">{t('Uppercase')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={charset.lower} onChange={e => patchCharset('lower', e.target.checked)} />
          <span className="field__label">{t('Lowercase')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={charset.digit} onChange={e => patchCharset('digit', e.target.checked)} />
          <span className="field__label">{t('Digits')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={charset.symbol} onChange={e => patchCharset('symbol', e.target.checked)} />
          <span className="field__label">{t('Symbols')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={charset.excludeSimilar}
            onChange={e => patchCharset('excludeSimilar', e.target.checked)}
          />
          <span className="field__label">{t('Exclude similar (0OIl1)')}</span>
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
        {meta ? (
          <p className="tool-status">
            {t('Strength')} {t(meta.strength)} · {t('Entropy')} ≈ {meta.entropyBits} bit
          </p>
        ) : null}
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
            {showMsg(message)}
          </p>
        ) : null}
      </div>

      {output ? (
        <label className="field field--block">
          <span className="field__label">{t('Result')}</span>
          <textarea className="field__textarea field__textarea--compact" value={output} readOnly spellCheck={false} rows={8} />
        </label>
      ) : null}
    </ToolPageShell>
  );
}
