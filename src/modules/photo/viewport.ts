import {MAX_ZOOM, MIN_ZOOM} from './constants';

export type ViewportRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

export function getViewOrigin(viewW: number, viewH: number, pan: {x: number; y: number}, zoom: number, width: number, height: number) {
  return {dx: viewW / 2 + pan.x - width * zoom / 2, dy: viewH / 2 + pan.y - height * zoom / 2, vw: viewW, vh: viewH};
}

export function clientToDoc(clientX: number, clientY: number, rect: ViewportRect, pan: {x: number; y: number}, zoom: number, width: number, height: number) {
  const {dx, dy} = getViewOrigin(rect.width, rect.height, pan, zoom, width, height);
  return {x: (clientX - rect.left - dx) / zoom, y: (clientY - rect.top - dy) / zoom};
}

export function clampZoom(zoom: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function fitZoom(viewW: number, viewH: number, docW: number, docH: number) {
  return clampZoom(Math.min(viewW / docW, viewH / docH) * .92);
}
