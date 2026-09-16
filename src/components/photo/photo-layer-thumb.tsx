'use client';

import {useEffect, useRef} from 'react';
import {applyMaskToCanvas, createLayerCanvas, drawTextLayer, type PhotoLayer} from '@/modules/photo';

// Small live preview of a layer's current content, shown before its name in the layers list.
// `version` is a change counter (historyTick) the caller bumps on every edit, since the layer's
// canvas is mutated in place by drawing tools and isn't itself React state.
export function LayerThumb({
  layer,
  buffers,
  masks,
  docWidth,
  docHeight,
  version
}: {
  layer: PhotoLayer;
  buffers: Map<string, HTMLCanvasElement>;
  masks: Map<string, HTMLCanvasElement>;
  docWidth: number;
  docHeight: number;
  version: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const tw = canvas.width, th = canvas.height;
    ctx.clearRect(0, 0, tw, th);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, tw, th);
    ctx.fillStyle = '#4a4a4a';
    for (let y = 0; y < th; y += 4) {
      for (let x = (Math.round(y / 4) % 2 ? 0 : 4); x < tw; x += 8) ctx.fillRect(x, y, 4, 4);
    }
    if (docWidth <= 0 || docHeight <= 0) return;
    const scale = Math.min(tw / docWidth, th / docHeight);
    const dw = docWidth * scale, dh = docHeight * scale;
    const dx = (tw - dw) / 2, dy = (th - dh) / 2;
    if (layer.kind === 'raster') {
      const src = buffers.get(layer.id);
      if (!src) return;
      const mask = layer.hasMask ? masks.get(layer.id) : null;
      ctx.drawImage(mask ? applyMaskToCanvas(src, mask) : src, dx, dy, dw, dh);
    } else if (layer.kind === 'text' && layer.text) {
      const tmp = createLayerCanvas(docWidth, docHeight);
      const tctx = tmp.getContext('2d');
      if (tctx) drawTextLayer(tctx, layer.text);
      ctx.drawImage(tmp, dx, dy, dw, dh);
    } else if (layer.kind === 'adjustment') {
      ctx.fillStyle = '#cfd6dd';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◆', tw / 2, th / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.id, layer.kind, layer.hasMask, layer.text, buffers, masks, docWidth, docHeight, version]);
  return <canvas ref={canvasRef} width={30} height={22} className="photo-layer__thumb" />;
}
