'use client';

import {useEffect, useRef, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {translateProgress} from '@/i18n/translate';
import {rebuildPdfPages, renderPageThumbnails} from '@/modules/pdf/pages';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

interface PageItem {
  index: number;
  url: string;
  deleted: boolean;
}

export default function PdfPagesTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const urlsRef = useRef<string[]>([]);

  const file = files[0];

  useEffect(() => {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setPages([]);
    setResult(null);
    setError('');
    if (!file) return;

    let cancelled = false;
    setLoading(true);
    setStatus('Preparing preview…');
    renderPageThumbnails(file, 0.3, msg => {
      if (!cancelled) setStatus(msg);
    })
      .then(thumbs => {
        if (cancelled) {
          thumbs.forEach(thumb => URL.revokeObjectURL(thumb.url));
          return;
        }
        urlsRef.current = thumbs.map(thumb => thumb.url);
        setPages(thumbs.map(thumb => ({index: thumb.index, url: thumb.url, deleted: false})));
        setStatus('');
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not create preview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsRef.current = [];
    };
  }, []);

  const move = (i: number, dir: -1 | 1) => {
    const next = i + dir;
    if (next < 0 || next >= pages.length) return;
    const copy = [...pages];
    const [item] = copy.splice(i, 1);
    copy.splice(next, 0, item);
    setPages(copy);
    setResult(null);
  };

  const toggleDelete = (i: number) => {
    setPages(pages.map((p, idx) => (idx === i ? {...p, deleted: !p.deleted} : p)));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    const ordered = pages.filter(p => !p.deleted).map(p => p.index);
    if (!ordered.length) {
      setError('No pages to export.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const blob = await rebuildPdfPages(file, ordered);
      setResult(blob);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell
      title="Edit Pages"
      description="Reorder pages with thumbnails, mark pages to delete, then export a new PDF."
    >
      <FileDropzone
        accept="application/pdf,.pdf"
        files={files}
        onChange={next => {
          setFiles(next);
        }}
        hint="1 PDF"
      />

      {loading || status ? (
        <p className="tool-status">{status ? translateProgress(status, t) : t('Loading…')}</p>
      ) : null}

      {pages.length > 0 ? (
        <div className="pdf-pages-grid">
          {pages.map((page, i) => (
            <div key={`${page.index}-${i}`} className={`pdf-pages-card${page.deleted ? ' pdf-pages-card--deleted' : ''}`}>
              <img src={page.url} alt={`${t('Page')} ${page.index + 1}`} />
              <div className="pdf-pages-card__meta">
                <span>
                  {t('Original')} {page.index + 1}
                </span>
                <span>#{i + 1}</span>
              </div>
              <div className="pdf-pages-card__actions">
                <button type="button" className="btn btn--ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="btn btn--ghost" disabled={i === pages.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => toggleDelete(i)}>
                  {page.deleted ? t('Restore') : t('Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || !pages.length || busy || loading} onClick={run}>
          {busy ? t('Exporting…') : t('Export PDF')}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result, replaceExtension(file?.name || 'edited.pdf', 'pdf'))}
          >
            {t('Download')} ({formatBytes(result.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
