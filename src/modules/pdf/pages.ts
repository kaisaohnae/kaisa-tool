import {PDFDocument} from 'pdf-lib';

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

/** Build a new PDF from 0-based source page indices in order. */
export async function rebuildPdfPages(file: File, orderedIndices: number[]): Promise<Blob> {
  if (!orderedIndices.length) throw new Error('No pages to export.');

  const src = await loadPdf(await file.arrayBuffer());
  const total = src.getPageCount();
  for (const idx of orderedIndices) {
    if (idx < 0 || idx >= total) throw new Error('Invalid page number.');
  }

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, orderedIndices);
  pages.forEach(page => out.addPage(page));
  return pdfBlob(await out.save());
}

export async function renderPageThumbnails(
  file: File,
  scale = 0.3,
  onProgress?: (message: string) => void
): Promise<{index: number; url: string; width: number; height: number}[]> {
  const {loadPdfDocument, renderPdfPageToCanvas} = await import('@/modules/pdf/pdfjs');
  const pdf = await loadPdfDocument(file);
  const results: {index: number; url: string; width: number; height: number}[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.(`Preparing preview… (${i}/${pdf.numPages})`);
      const canvas = await renderPdfPageToCanvas(pdf, i, scale);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Thumbnail generation failed.'))), 'image/jpeg', 0.7);
      });
      results.push({
        index: i - 1,
        url: URL.createObjectURL(blob),
        width: canvas.width,
        height: canvas.height
      });
    }
  } finally {
    await pdf.destroy();
  }

  return results;
}
