'use client';

import {useCallback, useRef, useState, type DragEvent, type ReactNode} from 'react';

interface FileDropzoneProps {
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  title?: string;
  hint?: string;
}

export default function FileDropzone({accept, multiple = false, files, onChange, title = '파일을 끌어다 놓거나 클릭', hint}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const next = Array.from(list);
      if (!next.length) return;
      onChange(multiple ? [...files, ...next] : [next[0]]);
    },
    [files, multiple, onChange]
  );

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

      {files.length > 0 ? (
        <div className="file-list" style={{marginTop: 12}}>
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className="file-list__item">
              <span className="file-list__name">{file.name}</span>
              <span className="file-list__meta">{(file.size / 1024).toFixed(1)} KB</span>
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
