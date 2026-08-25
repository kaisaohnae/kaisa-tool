import {PDFDocument} from 'pdf-lib';
import {
  canvasToBlob,
  drawImageToCanvas,
  flattenOnWhite,
  loadImageFromFile,
  releaseLoadedImage
} from '@/modules/shared/file';

export type StampPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'custom';

export interface StampOptions {
  /** 1-based page numbers, or empty/undefined for all pages */
  pages?: number[];
  position: StampPosition;
  /** Percent 0–100 when position is custom */
  xPercent?: number;
  yPercent?: number;
  /** Scale relative to page width (0–100) */
  scalePercent?: number;
  opacity?: number;
}

function pdfBlob(data: Uint8Array): Blob {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy], {type: 'application/pdf'});
}

async function loadPdf(bytes: ArrayBuffer) {
  try {
    return await PDFDocument.load(bytes, {ignoreEncryption: true});
  } catch {
    throw new Error('Could not open PDF. It may be damaged or unsupported.');
  }
}

async function embedImage(doc: PDFDocument, imageFile: File) {
  const type = imageFile.type.toLowerCase();
  const name = imageFile.name.toLowerCase();

  if (type === 'image/png' || name.endsWith('.png')) {
    return doc.embedPng(await imageFile.arrayBuffer());
  }
  if (type === 'image/jpeg' || type === 'image/jpg' || /\.jpe?g$/.test(name)) {
    return doc.embedJpg(await imageFile.arrayBuffer());
  }

  const img = await loadImageFromFile(imageFile);
  try {
    const canvas = flattenOnWhite(drawImageToCanvas(img));
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    return doc.embedJpg(await blob.arrayBuffer());
  } finally {
    releaseLoadedImage(img);
  }
}

function stampCoords(
  position: StampPosition,
  pageW: number,
  pageH: number,
  imgW: number,
  imgH: number,
  xPercent: number,
  yPercent: number
): {x: number; y: number} {
  const margin = Math.min(pageW, pageH) * 0.04;
  switch (position) {
    case 'top-left':
      return {x: margin, y: pageH - imgH - margin};
    case 'top-right':
      return {x: pageW - imgW - margin, y: pageH - imgH - margin};
    case 'bottom-left':
      return {x: margin, y: margin};
    case 'bottom-right':
      return {x: pageW - imgW - margin, y: margin};
    case 'custom': {
      const x = (Math.min(100, Math.max(0, xPercent)) / 100) * (pageW - imgW);
      const yFromTop = (Math.min(100, Math.max(0, yPercent)) / 100) * (pageH - imgH);
      return {x, y: pageH - imgH - yFromTop};
    }
    case 'center':
    default:
      return {x: (pageW - imgW) / 2, y: (pageH - imgH) / 2};
  }
}

export async function stampImageOnPdf(pdfFile: File, imageFile: File, options: StampOptions): Promise<Blob> {
  const doc = await loadPdf(await pdfFile.arrayBuffer());
  const total = doc.getPageCount();
  if (total < 1) throw new Error('This PDF has no pages.');

  const embedded = await embedImage(doc, imageFile);
  const scalePercent = Math.min(100, Math.max(1, options.scalePercent ?? 25));
  const opacity = Math.min(1, Math.max(0, options.opacity ?? 1));
  const xPercent = options.xPercent ?? 50;
  const yPercent = options.yPercent ?? 50;

  const targets = options.pages?.length
    ? [...new Set(options.pages)].filter(n => n >= 1 && n <= total)
    : Array.from({length: total}, (_, i) => i + 1);

  if (!targets.length) throw new Error('Select pages to stamp.');

  for (const n of targets) {
    const page = doc.getPage(n - 1);
    const {width: pageW, height: pageH} = page.getSize();
    const targetW = (pageW * scalePercent) / 100;
    const ratio = embedded.height / embedded.width;
    const targetH = targetW * ratio;
    const {x, y} = stampCoords(options.position, pageW, pageH, targetW, targetH, xPercent, yPercent);
    page.drawImage(embedded, {
      x,
      y,
      width: targetW,
      height: targetH,
      opacity
    });
  }

  return pdfBlob(await doc.save());
}
