'use client';

import {useEffect, useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {readPdfMetadata, writePdfMetadata, type PdfMetadataFields} from '@/modules/pdf/metadata';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

const EMPTY: PdfMetadataFields = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
  creator: '',
  producer: '',
  creationDate: '',
  modificationDate: ''
};

const FIELD_KEYS: {key: keyof PdfMetadataFields; label: string; type?: string}[] = [
  {key: 'title', label: 'Title'},
  {key: 'author', label: 'Author'},
  {key: 'subject', label: 'Subject'},
  {key: 'keywords', label: 'Keywords (comma-separated)'},
  {key: 'creator', label: 'Creator app'},
  {key: 'producer', label: 'Producer'},
  {key: 'creationDate', label: 'Created', type: 'datetime-local'},
  {key: 'modificationDate', label: 'Modified', type: 'datetime-local'}
];

export default function PdfMetadataTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [fields, setFields] = useState<PdfMetadataFields>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const file = files[0];

  useEffect(() => {
    setFields(EMPTY);
    setResult(null);
    setError('');
    if (!file) return;
    let cancelled = false;
    setLoading(true);
    readPdfMetadata(file)
      .then(meta => {
        if (!cancelled) setFields(meta);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not read metadata.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const patch = (key: keyof PdfMetadataFields, value: string) => {
    setFields(prev => ({...prev, [key]: value}));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await writePdfMetadata(file, fields);
      setResult(blob);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell
      title="Metadata"
      description="Review and edit document properties such as title and author, then save a new file."
    >
      <FileDropzone
        accept="application/pdf,.pdf"
        files={files}
        onChange={next => {
          setFiles(next);
        }}
        hint="1 PDF"
      />

      {loading ? <p className="tool-status">{t('Reading metadata…')}</p> : null}

      {file && !loading ? (
        <div className="tool-controls" style={{flexDirection: 'column', alignItems: 'stretch'}}>
          {FIELD_KEYS.map(f => (
            <label key={f.key} className="field field--block">
              <span className="field__label">{t(f.label)}</span>
              <input
                className="field__input"
                type={f.type || 'text'}
                value={fields[f.key]}
                onChange={e => patch(f.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy || loading} onClick={run}>
          {busy ? t('Saving…') : t('Save metadata')}
        </button>
        {result ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadBlob(result, replaceExtension(file?.name || 'metadata.pdf', 'pdf'))}
          >
            {t('Download')} ({formatBytes(result.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
