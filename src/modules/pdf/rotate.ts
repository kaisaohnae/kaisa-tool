import {PDFDocument, degrees} from 'pdf-lib';

export type PdfRotateDegrees = 90 | 180 | 270;

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

/** Rotate all pages, or specific 1-based page numbers. */
export async function rotatePdfPages(
  file: File,
  angle: PdfRotateDegrees,
  pageNumbers?: number[]
): Promise<Blob> {
  const doc = await loadPdf(await file.arrayBuffer());
  const total = doc.getPageCount();
  if (total < 1) throw new Error('This PDF has no pages.');

  const targets = pageNumbers?.length
    ? [...new Set(pageNumbers)].filter(n => n >= 1 && n <= total)
    : Array.from({length: total}, (_, i) => i + 1);

  if (!targets.length) throw new Error('Select pages to rotate.');

  for (const n of targets) {
    const page = doc.getPage(n - 1);
    const current = page.getRotation().angle;
    page.setRotation(degrees((((current + angle) % 360) + 360) % 360));
  }

  return pdfBlob(await doc.save());
}
