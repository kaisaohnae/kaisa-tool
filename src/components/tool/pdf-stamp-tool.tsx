'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {PDFDocument} from 'pdf-lib';
import {stampImageOnPdf, type StampPosition} from '@/modules/pdf/stamp';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

const POSITION_VALUES: StampPosition[] = [
  'top-left',
  'top-right',
  'center',
  'bottom-left',
  'bottom-right',
  'custom'
];

const POSITION_KEYS: Record<StampPosition, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  center: 'Center',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right',
  custom: 'Custom (%)'
};

export default function PdfStampTool() {
  const t = useT();
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pageScope, setPageScope] = useState<'all' | 'one'>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<StampPosition>('bottom-right');
  const [xPercent, setXPercent] = useState(50);
  const [yPercent, setYPercent] = useState(50);
  const [scalePercent, setScalePercent] = useState(25);
  const [opacity, setOpacity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const pdfFile = pdfFiles[0];
  const imageFile = imageFiles[0];

  useEffect(() => {
    if (!pdfFile) {
      setPageCount(0);
      return;
    }
    let cancelled = false;
    pdfFile
      .arrayBuffer()
      .then(buf => PDFDocument.load(buf, {ignoreEncryption: true}))
      .then(doc => {
        if (!cancelled) {
          const n = doc.getPageCount();
          setPageCount(n);
          setPageNumber(1);
        }
      })
      .catch(() => {
        if (!cancelled) setPageCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pdfFile]);

  const run = async () => {
    if (!pdfFile || !imageFile) return;
    setBusy(true);
    setError('');
    try {
      const blob = await stampImageOnPdf(pdfFile, imageFile, {
        pages: pageScope === 'all' ? undefined : [pageNumber],
        position,
        xPercent,
        yPercent,
        scalePercent,
        opacity
      });
      setResult(blob);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Stamp failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Stamp Image" description="Place a logo or stamp image on PDF pages.">
      <FileDropzone
        accept="application/pdf,.pdf"
        files={pdfFiles}
        onChange={next => {
          setPdfFiles(next);
          setResult(null);
          setError('');
        }}
        title="PDF file"
        hint="1 PDF"
      />

      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={imageFiles}
        onChange={next => {
          setImageFiles(next);
          setResult(null);
          setError('');
        }}
        title="Image to stamp"
        hint="JPG, PNG, WebP"
      />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Page')}</span>
          <select
            className="field__select"
            value={pageScope}
            onChange={e => {
              setPageScope(e.target.value as 'all' | 'one');
              setResult(null);
            }}
          >
            <option value="all">
              {t('All pages')}
              {pageCount ? ` (${pageCount})` : ''}
            </option>
            <option value="one">{t('Specific page')}</option>
          </select>
        </label>
        {pageScope === 'one' ? (
          <label className="field">
            <span className="field__label">{t('Page number')}</span>
            <input
              className="field__input"
              type="number"
              min={1}
              max={Math.max(1, pageCount)}
              value={pageNumber}
              onChange={e => {
                setPageNumber(Number(e.target.value) || 1);
                setResult(null);
              }}
            />
          </label>
        ) : null}
        <label className="field">
          <span className="field__label">{t('Position')}</span>
          <select
            className="field__select"
            value={position}
            onChange={e => {
              setPosition(e.target.value as StampPosition);
              setResult(null);
            }}
          >
            {POSITION_VALUES.map(value => (
              <option key={value} value={value}>
                {t(POSITION_KEYS[value])}
              </option>
            ))}
          </select>
        </label>
        {position === 'custom' ? (
          <>
            <label className="field">
              <span className="field__label">X {xPercent}%</span>
              <input
                className="field__range"
                type="range"
                min={0}
                max={100}
                value={xPercent}
                onChange={e => {
                  setXPercent(Number(e.target.value));
                  setResult(null);
                }}
              />
            </label>
            <label className="field">
              <span className="field__label">Y {yPercent}%</span>
              <input
                className="field__range"
                type="range"
                min={0}
                max={100}
                value={yPercent}
                onChange={e => {
                  setYPercent(Number(e.target.value));
                  setResult(null);
                }}
              />
            </label>
          </>
        ) : null}
        <label className="field">
          <span className="field__label">
            {t('Size')} {scalePercent}%
          </span>
          <input
            className="field__range"
            type="range"
            min={5}
            max={100}
            step={1}
            value={scalePercent}
            onChange={e => {
              setScalePercent(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
        <label className="field">
          <span className="field__label">
            {t('Opacity')} {Math.round(opacity * 100)}%
          </span>
          <input
            className="field__range"
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={e => {
              setOpacity(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!pdfFile || !imageFile || busy} onClick={run}>
          {busy ? t('Stamping…') : t('Stamp Image')}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result, replaceExtension(pdfFile?.name || 'stamped.pdf', 'pdf'))}
          >
            {t('Download')} ({formatBytes(result.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
