import {useEffect, type RefObject} from 'react';
import {pathFromSelection, selectionMaskOutline, type PhotoSelection} from '@/modules/photo';

type Props = {
  selectionCanvasRef: RefObject<HTMLCanvasElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  selectionMaskRef: RefObject<HTMLCanvasElement | null>;
  hasDoc: boolean; liveSel: PhotoSelection | null; draftSel: PhotoSelection | null;
  cropDraft: PhotoSelection | null; transform: unknown;
  zoom: number; pan: {x: number; y: number};
  getViewOrigin: () => {dx: number; dy: number};
};
export function usePhotoSelectionOverlay({selectionCanvasRef, viewportRef, selectionMaskRef, hasDoc, liveSel, draftSel, cropDraft, transform, zoom, pan, getViewOrigin}: Props) {
  useEffect(() => {
    const canvas = selectionCanvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(viewport.clientWidth * dpr);
    canvas.height = Math.round(viewport.clientHeight * dpr);
    if (!hasDoc || !liveSel || cropDraft || transform) return;
    const mask = !draftSel ? selectionMaskRef.current : null;
    const outline = mask ? selectionMaskOutline(mask) : null;
    let frame = 0, previous = -Infinity;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (time: number) => {
      if (time - previous >= 60 || reducedMotion) {
        previous = time;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const {dx, dy} = getViewOrigin();
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * dx, dpr * dy);
        ctx.lineWidth = 1 / zoom;
        const stroke = () => {
          if (outline) ctx.stroke(outline);
          else {pathFromSelection(ctx, liveSel); ctx.stroke();}
        };
        ctx.setLineDash([]); ctx.strokeStyle = '#ffffff'; stroke();
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.lineDashOffset = reducedMotion ? 0 : -(time / 90 % 8) / zoom;
        ctx.strokeStyle = '#000000'; stroke();
      }
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(() => {
      canvas.width = Math.round(viewport.clientWidth * dpr);
      canvas.height = Math.round(viewport.clientHeight * dpr);
      previous = -Infinity;
      if (reducedMotion) draw(performance.now());
    });
    observer.observe(viewport);
    frame = requestAnimationFrame(draw);
    return () => {observer.disconnect(); cancelAnimationFrame(frame); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);};
  }, [selectionCanvasRef, viewportRef, selectionMaskRef, hasDoc, liveSel, draftSel, cropDraft, transform, zoom, pan, getViewOrigin]);
}
