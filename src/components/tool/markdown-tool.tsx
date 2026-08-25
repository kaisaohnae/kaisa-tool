'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {markdownToHtml} from '@/modules/format/markdown';

const DEFAULT_MD = '# Heading\n\n**Bold** and *italic*, `code`\n\n- Item 1\n- Item 2\n';

export default function MarkdownTool() {
  const t = useT();
  const [input, setInput] = useState(DEFAULT_MD);
  const [breaks, setBreaks] = useState(true);
  const [gfm, setGfm] = useState(true);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const preview = useMemo(() => markdownToHtml(input, {breaks, gfm}), [input, breaks, gfm]);
  const html = preview.ok ? preview.html : '';

  const copyHtml = async () => {
    if (!preview.ok || !html) {
      setMessage({type: 'error', text: preview.ok ? 'No HTML to copy.' : preview.error});
      return;
    }
    try {
      await navigator.clipboard.writeText(html);
      setMessage({type: 'ok', text: 'HTML copied.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  const clear = () => {
    setInput('');
    setMessage(null);
  };

  return (
    <ToolPageShell title="Markdown" description="Live-preview Markdown rendered as HTML.">
      <div className="tool-controls">
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={gfm}
            onChange={e => {
              setGfm(e.target.checked);
              setMessage(null);
            }}
          />
          <span className="field__label">GFM</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={breaks}
            onChange={e => {
              setBreaks(e.target.checked);
              setMessage(null);
            }}
          />
          <span className="field__label">{t('Line breaks → <br>')}</span>
        </label>
      </div>

      <div className="markdown-split">
        <label className="field field--block">
          <span className="field__label">{t('Markdown')}</span>
          <textarea
            className="field__textarea"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setMessage(null);
            }}
            placeholder="# Hello"
            spellCheck={false}
            rows={16}
          />
        </label>

        <div className="field field--block">
          <span className="field__label">{t('Preview')}</span>
          <div className="markdown-preview" dangerouslySetInnerHTML={{__html: html}} />
          {!preview.ok ? <p className="tool-status tool-status--error">{t(preview.error)}</p> : null}
        </div>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={copyHtml} disabled={!html}>
          {t('Copy HTML')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!input}>
          {t('Clear')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
