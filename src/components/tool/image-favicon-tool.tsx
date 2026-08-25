'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {generateFaviconPng, generateFaviconZip, type FaviconFit} from '@/modules/image/favicon';
import {downloadBlob, formatBytes} from '@/modules/shared/file';

export default function ImageFaviconTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [fit, setFit] = useState<FaviconFit>('cover');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [zip, setZip] = useState<Blob | null>(null);
  const [png32, setPng32] = useState<Blob | null>(null);

  const file = files[0];
  const previewUrl = useObjectUrl(file);
  const png32Url = useObjectUrl(png32);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const [zipBlob, icon] = await Promise.all([generateFaviconZip(file, fit), generateFaviconPng(file, 32, fit)]);
      setZip(zipBlob);
      setPng32(icon);
    } catch (e) {
      setZip(null);
      setPng32(null);
      setError(e instanceof Error ? e.message : 'Favicon generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Favicon" description="Fit the image to a square and export favicon PNGs as a ZIP.">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={files}
        onChange={next => {
          setFiles(next);
          setZip(null);
          setPng32(null);
          setError('');
        }}
        hint="JPG, PNG, WebP"
      />

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Square fit')}</span>
          <select
            className="field__select"
            value={fit}
            onChange={e => {
              setFit(e.target.value as FaviconFit);
              setZip(null);
              setPng32(null);
            }}
          >
            <option value="cover">{t('Cover (crop to fill)')}</option>
            <option value="contain">{t('Contain (fit inside)')}</option>
          </select>
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Generating…') : t('Generate favicon')}
        </button>
        {zip ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(zip, 'favicon.zip')}>
            {t('Download ZIP')} ({formatBytes(zip.size)})
          </button>
        ) : null}
        {png32 ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(png32, 'favicon-32x32.png')}>
            {t('Download 32×32 PNG')} ({formatBytes(png32.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {file && previewUrl ? (
        <div className="preview-box">
          <p className="field__label">{t('Original')}</p>
          <img src={previewUrl} alt={t('Original')} />
        </div>
      ) : null}

      {png32 && png32Url ? (
        <div className="preview-box">
          <p className="field__label">{t('32×32 preview')}</p>
          <img src={png32Url} alt="favicon 32" style={{width: 32, height: 32, imageRendering: 'pixelated'}} />
        </div>
      ) : null}
    </ToolPageShell>
  );
}
