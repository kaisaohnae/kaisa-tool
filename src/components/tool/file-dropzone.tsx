'use client';

import {useCallback, useRef, useState, type DragEvent, type ReactNode} from 'react';
import {filterAcceptedFiles, formatBytes} from '@/modules/shared/file';

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
  title = '파일을 끌어다 놓거나 클릭',
  hint
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [rejectHint, setRejectHint] = useState('');

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const accepted = filterAcceptedFiles(list, accept);
      const rejected = Array.from(list).length - accepted.length;
      setRejectHint(rejected > 0 ? `지원하지 않는 파일 ${rejected}개를 제외했습니다.` : '');
      if (!accepted.length) return;
      onChange(multiple ? [...files, ...accepted] : [accepted[0]]);
    },
    [accept, files, multiple, onChange]
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
        <p className="dropzone__title">{title}</p>
        {hint ? <p className="dropzone__hint">{hint}</p> : null}
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
                제거
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ToolPageShell({title, description, children}: {title: string; description: string; children: ReactNode}) {
  return (
    <article className="tool-page">
      <h1 className="tool-page__title">{title}</h1>
      <p className="tool-page__desc">{description}</p>
      <div className="tool-panel">{children}</div>
    </article>
  );
}
