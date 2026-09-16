'use client';
import {useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {fitContextMenu} from '@/modules/photo/context-menu';

export function PhotoContextMenu({x, y, children}: {x: number; y: number; children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{left: number; top: number} | null>(null);
  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const place = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const offsetX = viewport?.offsetLeft ?? 0, offsetY = viewport?.offsetTop ?? 0;
      menu.style.maxWidth = `${Math.max(0, width - 16)}px`;
      menu.style.maxHeight = `${Math.max(0, height - 16)}px`;
      const rect = menu.getBoundingClientRect();
      const next = fitContextMenu(x - offsetX, y - offsetY, rect.width, rect.height, width, height);
      next.left += offsetX; next.top += offsetY;
      setPosition(previous => previous?.left === next.left && previous.top === next.top ? previous : next);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(menu);
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [x, y]);
  return <div ref={ref} className="photo-context" style={{left: position?.left ?? x, top: position?.top ?? y, visibility: position ? 'visible' : 'hidden'}}
    onClick={event => event.stopPropagation()}>{children}</div>;
}