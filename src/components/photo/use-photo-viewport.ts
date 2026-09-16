import {type RefObject, useCallback} from 'react';
import {
  fitZoom as calculateFitZoom,
  getViewOrigin as calculateViewOrigin,
  clampZoom,
  clientToDoc,
  snapPoint,
  type PhotoGuide
} from '@/modules/photo';

// Screen<->document coordinate conversion, snap-to-guide, and zoom/pan controls for the photo
// viewport. Pulled out of PhotoEditor as a pure move (no behavior change) since these five
// callbacks share the same small set of inputs (the viewport ref, pan/zoom, doc size) and are
// otherwise independent of the rest of the editor's state.
export function usePhotoViewport({
  viewportRef,
  pan,
  zoom,
  width,
  height,
  snapEnabled,
  guides,
  gridSize,
  hasDoc,
  setZoom,
  setPan,
  setZoomInputDraft
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  pan: {x: number; y: number};
  zoom: number;
  width: number;
  height: number;
  snapEnabled: boolean;
  guides: PhotoGuide[];
  gridSize: number;
  hasDoc: boolean;
  setZoom: (zoom: number) => void;
  setPan: (pan: {x: number; y: number}) => void;
  setZoomInputDraft: (value: string | null) => void;
}) {
  const getDocPoint = useCallback(
    (clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return {x: 0, y: 0};
      const rect = viewport.getBoundingClientRect();
      return clientToDoc(clientX, clientY, rect, pan, zoom, width, height);
    },
    [viewportRef, pan, width, height, zoom]
  );

  const snapDocPoint = useCallback((point: {x: number; y: number}) => {
    if (!snapEnabled) return point;
    return snapPoint(point, {guides, gridSize, zoom});
  }, [snapEnabled, guides, gridSize, zoom]);

  const getViewOrigin = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return {dx: 0, dy: 0, vw: 0, vh: 0};
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    return calculateViewOrigin(vw, vh, pan, zoom, width, height);
  }, [viewportRef, pan, width, height, zoom]);

  const commitZoomInput = useCallback((raw: string) => {
    const pct = Number(raw);
    if (Number.isFinite(pct) && pct > 0) setZoom(clampZoom(pct / 100));
    setZoomInputDraft(null);
  }, [setZoom, setZoomInputDraft]);

  const fitZoom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !hasDoc) return;
    setZoom(calculateFitZoom(viewport.clientWidth, viewport.clientHeight, width, height));
    setPan({x: 0, y: 0});
  }, [viewportRef, hasDoc, width, height, setZoom, setPan]);

  return {getDocPoint, snapDocPoint, getViewOrigin, commitZoomInput, fitZoom};
}
