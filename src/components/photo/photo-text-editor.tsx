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
    element.focus({preventScroll: true});
    const frame = requestAnimationFrame(() => element.focus({preventScroll: true}));
    element.setSelectionRange(element.value.length, element.value.length);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.width = '0';
    element.style.width = `${Math.max(120, element.scrollWidth + 4)}px`;
    element.style.height = '0';
    element.style.height = `${Math.max(text.fontSize * text.lineHeight * zoom, element.scrollHeight + 2)}px`;
  }, [text.content, text.fontFamily, text.fontSize, text.fontWeight, text.fontStyle, text.lineHeight, text.tracking, zoom]);

  const scale = Math.max(0.05, zoom);
  return (
    <textarea
      ref={ref}
      className="photo-text-editor"
      aria-label="Edit text layer"
      value={text.content}
      rows={1}
      wrap="off"
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
        letterSpacing: `${text.tracking * scale}px`,
        textDecoration: text.underline ? 'underline' : undefined,
        WebkitTextStroke: text.strokeWidth > 0 ? `${text.strokeWidth * scale}px ${text.strokeColor}` : undefined,
        paintOrder: 'stroke fill',
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
      onBlur={event => {
        const next = event.relatedTarget as HTMLElement | null;
        if (!cancelledRef.current && !next?.closest('.photo-options')) onCommit();
      }}
    />
  );
}
