'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {PDFDocument} from 'pdf-lib';
import {rotatePdfPages, type PdfRotateDegrees} from '@/modules/pdf/rotate';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

export default function PdfRotateTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<PdfRotateDegrees>(90);
  const [scope, setScope] = useState<'all' | 'pages'>('all');
  const [pageInput, setPageInput] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const file = files[0];

  useEffect(() => {
    if (!file) {
      setPageCount(0);
      return;
    }
    let cancelled = false;
    file
      .arrayBuffer()
      .then(buf => PDFDocument.load(buf, {ignoreEncryption: true}))
      .then(doc => {
        if (!cancelled) setPageCount(doc.getPageCount());
      })
      .catch(() => {
        if (!cancelled) setPageCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const parsePages = (): number[] | undefined => {
    if (scope === 'all') return undefined;
    const nums = pageInput
      .split(/[,\s]+/)
      .map(s => Number(s.trim()))
      .filter(n => Number.isInteger(n) && n >= 1);
    return nums;
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const pages = parsePages();
      if (scope === 'pages' && (!pages || !pages.length)) {
        throw new Error('Enter page numbers. e.g. 1,3,5');
      }
      const blob = await rotatePdfPages(file, angle, pages);
      setResult(blob);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Rotation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Rotate Pages" description="Rotate all pages or selected pages in 90° steps.">
      <FileDropzone
        accept="application/pdf,.pdf"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        hint="1 PDF"
      />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Rotation angle')}</span>
          <select
            className="field__select"
            value={angle}
            onChange={e => {
              setAngle(Number(e.target.value) as PdfRotateDegrees);
              setResult(null);
            }}
          >
            <option value={90}>{t('Clockwise 90°')}</option>
            <option value={180}>180°</option>
            <option value={270}>{t('Counterclockwise 90°')}</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">{t('Apply to')}</span>
          <select
            className="field__select"
            value={scope}
            onChange={e => {
              setScope(e.target.value as 'all' | 'pages');
              setResult(null);
            }}
          >
            <option value="all">
              {t('All pages')}
              {pageCount ? ` (${pageCount})` : ''}
            </option>
            <option value="pages">{t('Selected pages only')}</option>
          </select>
        </label>
        {scope === 'pages' ? (
          <label className="field field--block">
            <span className="field__label">{t('Page numbers (comma-separated)')}</span>
            <input
              className="field__input"
              value={pageInput}
              placeholder={t('e.g. 1, 2, 5')}
              onChange={e => {
                setPageInput(e.target.value);
                setResult(null);
              }}
            />
          </label>
        ) : null}
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Rotating…') : t('Apply rotation')}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result, replaceExtension(file?.name || 'rotated.pdf', 'pdf'))}
          >
            {t('Download')} ({formatBytes(result.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
