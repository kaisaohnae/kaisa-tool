'use client';

import {useEffect, useRef} from 'react';
import type {TextLayerData} from '@/modules/photo';

type Props = {
  text: TextLayerData;
  left: number;
  top: number;
  zoom: number;
  onChange: (content: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export function PhotoTextEditor({text, left, top, zoom, onChange, onCommit, onCancel}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = '0';
    element.style.height = `${Math.max(text.fontSize * text.lineHeight * zoom, element.scrollHeight + 2)}px`;
  }, [text.content, text.fontSize, text.lineHeight, zoom]);

  const scale = Math.max(0.05, zoom);
  return (
    <textarea
      ref={ref}
      className="photo-text-editor"
      value={text.content}
      rows={1}
      spellCheck={false}
      style={{
        left,
        top,
        minWidth: `${Math.max(120, text.fontSize * 4 * scale)}px`,
        fontFamily: text.fontFamily,
        fontSize: `${text.fontSize * scale}px`,
        fontWeight: text.fontWeight,
        fontStyle: text.fontStyle,
        lineHeight: String(text.lineHeight),
        color: text.color,
        textAlign: text.align,
        transform: text.align === 'center' ? 'translateX(-50%)' : text.align === 'right' ? 'translateX(-100%)' : undefined
      }}
      onChange={event => onChange(event.target.value)}
      onPointerDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          cancelledRef.current = true;
          onCancel();
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          onCommit();
        }
      }}
      onBlur={() => {
        if (!cancelledRef.current) onCommit();
      }}
    />
  );
}
