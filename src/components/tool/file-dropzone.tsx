'use client';

import {useCallback, useRef, useState, type DragEvent, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {filterAcceptedFiles, formatBytes} from '@/modules/shared/file';
import {pathToToolKey} from '@/modules/shared/tool-key';
import {useT} from '@/i18n/locale-context';
import ToolRequestSection from '@/components/tool/tool-request-section';
import {toolJsonLd} from '@/lib/seo';

interface FileDropzoneProps {
  accept: string;
  multiple?: boolean;
  sortable?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  title?: string;
  hint?: string;
}

export default function FileDropzone({
  accept,
  multiple = false,
  sortable = false,
  files,
  onChange,
  title,
  hint
}: FileDropzoneProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [rejectHint, setRejectHint] = useState('');
  const dropTitle = t(title ?? 'Drop files here or click');

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const accepted = filterAcceptedFiles(list, accept);
      const rejected = Array.from(list).length - accepted.length;
      setRejectHint(rejected > 0 ? t('Unsupported files were skipped.') : '');
      if (!accepted.length) return;
      onChange(multiple ? [...files, ...accepted] : [accepted[0]]);
    },
    [accept, files, multiple, onChange, t]
  );

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= files.length) return;
    const copy = [...files];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`dropzone${active ? ' dropzone--active' : ''}`}
        onDragOver={e => {
          e.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <p className="dropzone__title">{dropTitle}</p>
        {hint ? <p className="dropzone__hint">{t(hint)}</p> : null}
        <input
          ref={inputRef}
          className="dropzone__input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {rejectHint ? <p className="tool-status">{rejectHint}</p> : null}

      {files.length > 0 ? (
        <div className="file-list" style={{marginTop: 12}}>
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="file-list__item">
              <span className="file-list__name">
                {sortable ? `${index + 1}. ` : ''}
                {file.name}
              </span>
              <span className="file-list__meta">{formatBytes(file.size)}</span>
              {sortable ? (
                <span className="file-list__order">
                  <button type="button" className="file-list__remove" disabled={index === 0} onClick={e => { e.stopPropagation(); move(index, -1); }}>
                    ↑
                  </button>
                  <button type="button" className="file-list__remove" disabled={index === files.length - 1} onClick={e => { e.stopPropagation(); move(index, 1); }}>
                    ↓
                  </button>
                </span>
              ) : null}
              <button
                type="button"
                className="file-list__remove"
                onClick={e => {
                  e.stopPropagation();
                  onChange(files.filter((_, i) => i !== index));
                }}
              >
                {t('Remove')}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ToolPageShell({title, description, children}: {title: string; description: string; children: ReactNode}) {
  const t = useT();
  const pathname = usePathname();
  const toolKey = pathToToolKey(pathname);
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const jsonLd = toolJsonLd(normalized);

  return (
    <article className="tool-page">
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      ) : null}
      <h1 className="tool-page__title">{t(title)}</h1>
      <p className="tool-page__desc">{t(description)}</p>
      <div className="tool-panel">{children}</div>
      {toolKey ? <ToolRequestSection toolKey={toolKey} /> : null}
    </article>
  );
}
