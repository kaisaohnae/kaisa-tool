'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {hashFile, hashesMatch, hashText, type HashAlgo} from '@/modules/format/hash';

const ALGOS: HashAlgo[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export default function HashTool() {
  const t = useT();
  const [source, setSource] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [algo, setAlgo] = useState<HashAlgo>('SHA-256');
  const [uppercase, setUppercase] = useState(false);
  const [expected, setExpected] = useState('');
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (source === 'text') {
        if (!text) {
          setHash('');
          return;
        }
        setBusy(true);
        try {
          const value = await hashText(text, algo, uppercase);
          if (!cancelled) {
            setHash(value);
            setMessage(null);
          }
        } catch (e) {
          if (!cancelled) {
            setHash('');
            setMessage({type: 'error', text: e instanceof Error ? e.message : 'Hash calculation failed.'});
          }
        } finally {
          if (!cancelled) setBusy(false);
        }
        return;
      }

      const file = files[0];
      if (!file) {
        setHash('');
        return;
      }
      setBusy(true);
      try {
        const value = await hashFile(file, algo, uppercase);
        if (!cancelled) {
          setHash(value);
          setMessage(null);
        }
      } catch (e) {
        if (!cancelled) {
          setHash('');
          setMessage({type: 'error', text: e instanceof Error ? e.message : 'File hash calculation failed.'});
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    const timer = window.setTimeout(run, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, text, files, algo, uppercase]);

  const copy = async () => {
    if (!hash) {
      setMessage({type: 'error', text: 'No hash to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(hash);
      setMessage({type: 'ok', text: 'Hash copied.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setText('');
    setFiles([]);
    setExpected('');
    setHash('');
    setMessage(null);
  };

  const match =
    hash && expected.trim()
      ? hashesMatch(hash, expected)
        ? {type: 'ok' as const, text: 'Matches expected hash.'}
        : {type: 'error' as const, text: 'Does not match expected hash.'}
      : null;

  return (
    <ToolPageShell
      title="Hash"
      description="Compute MD5 / SHA hashes for text or a file. All work stays in the browser."
    >
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Input')}</span>
          <select
            className="field__select"
            value={source}
            onChange={e => {
              setSource(e.target.value as 'text' | 'file');
              setMessage(null);
            }}
          >
            <option value="text">{t('Text')}</option>
            <option value="file">{t('File')}</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Algorithm')}</span>
          <select
            className="field__select"
            value={algo}
            onChange={e => {
              setAlgo(e.target.value as HashAlgo);
              setMessage(null);
            }}
          >
            {ALGOS.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} />
          <span className="field__label">{t('Uppercase HEX')}</span>
        </label>
        {busy ? <p className="tool-status">{t('Calculating…')}</p> : null}
      </div>

      {source === 'text' ? (
        <label className="field field--block">
          <span className="field__label">{t('Text')}</span>
          <textarea
            className="field__textarea field__textarea--compact"
            value={text}
            onChange={e => {
              setText(e.target.value);
              setMessage(null);
            }}
            placeholder={t('Text to hash')}
            spellCheck={false}
            rows={8}
          />
        </label>
      ) : (
        <FileDropzone
          accept="*/*"
          files={files}
          onChange={next => {
            setFiles(next);
            setMessage(null);
          }}
          title="Drop files here or click"
          hint="Single file hash"
        />
      )}

      <label className="field field--block">
        <span className="field__label">{t('Hash result')}</span>
        <textarea
          className="field__textarea field__textarea--compact"
          value={hash}
          readOnly
          spellCheck={false}
          rows={3}
          placeholder={t('Result appears here')}
        />
      </label>

      <label className="field field--block">
        <span className="field__label">{t('Expected hash (optional)')}</span>
        <input
          className="field__input"
          value={expected}
          onChange={e => setExpected(e.target.value)}
          placeholder={t('Expected hash to compare')}
          spellCheck={false}
        />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={copy} disabled={!hash}>
          {t('Copy')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={clear}
          disabled={!text && !files.length && !hash && !expected}
        >
          {t('Clear')}
        </button>
        {match ? (
          <p className={`tool-status${match.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(match.text)}</p>
        ) : null}
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
