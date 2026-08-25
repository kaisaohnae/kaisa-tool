import {PDFDocument} from 'pdf-lib';
import JSZip from 'jszip';
import {canvasToBlob, fileToJpegBytes} from '@/modules/shared/file';

export type ProgressFn = (message: string) => void;

function pdfBlob(data: Uint8Array): Blob {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy], {type: 'application/pdf'});
}

async function loadPdf(bytes: ArrayBuffer) {
  try {
    return await PDFDocument.load(bytes, {ignoreEncryption: true});
  } catch {
    throw new Error('PDF를 열 수 없습니다. 손상되었거나 지원하지 않는 형식일 수 있습니다.');
  }
}

export async function mergePdfs(files: File[], onProgress?: ProgressFn): Promise<Blob> {
  if (files.length < 2) throw new Error('PDF를 2개 이상 선택하세요.');
  const out = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress?.(`합치는 중… (${i + 1}/${files.length})`);
    const bytes = await files[i].arrayBuffer();
    const doc = await loadPdf(bytes);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => out.addPage(page));
  }

  return pdfBlob(await out.save());
}

export async function splitPdf(file: File, onProgress?: ProgressFn): Promise<{blob: Blob; name: string}[]> {
  const bytes = await file.arrayBuffer();
  const src = await loadPdf(bytes);
  const total = src.getPageCount();
  if (total < 1) throw new Error('페이지가 없는 PDF입니다.');

  const base = file.name.replace(/\.pdf$/i, '') || 'pdf';
  const results: {blob: Blob; name: string}[] = [];

  for (let i = 0; i < total; i++) {
    onProgress?.(`분할 중… (${i + 1}/${total})`);
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    results.push({
      blob: pdfBlob(await doc.save()),
      name: `${base}-p${String(i + 1).padStart(String(total).length, '0')}.pdf`
    });
  }
  return results;
}

export async function jpgToPdf(files: File[], onProgress?: ProgressFn): Promise<Blob> {
  if (!files.length) throw new Error('이미지를 선택하세요.');
  const doc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress?.(`PDF 만드는 중… (${i + 1}/${files.length})`);
    const bytes = await fileToJpegBytes(files[i], 0.92);
    const image = await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {x: 0, y: 0, width: image.width, height: image.height});
  }

  return pdfBlob(await doc.save());
}

export async function pdfToJpg(file: File, quality = 0.85, scale = 2, onProgress?: ProgressFn): Promise<{blob: Blob; name: string}[]> {
  const {loadPdfDocument, renderPdfPageToCanvas} = await import('@/modules/pdf/pdfjs');
  const pdf = await loadPdfDocument(file);
  const total = pdf.numPages;
  if (total < 1) throw new Error('페이지가 없는 PDF입니다.');

  const base = file.name.replace(/\.pdf$/i, '') || 'pdf';
  const results: {blob: Blob; name: string}[] = [];
  const safeScale = Math.min(3, Math.max(0.5, scale));

  try {
    for (let i = 1; i <= total; i++) {
      onProgress?.(`JPG 변환 중… (${i}/${total})`);
      const canvas = await renderPdfPageToCanvas(pdf, i, safeScale);
      const blob = await canvasToBlob(canvas, 'image/jpeg', Math.min(1, Math.max(0.1, quality)));
      results.push({
        blob,
        name: `${base}-p${String(i).padStart(String(total).length, '0')}.jpg`
      });
    }
  } finally {
    await pdf.destroy();
  }

  return results;
}

export async function compressPdf(file: File, quality = 0.7, scale = 1.25, onProgress?: ProgressFn): Promise<Blob> {
  const {loadPdfDocument, renderPdfPageToCanvas} = await import('@/modules/pdf/pdfjs');
  const pdf = await loadPdfDocument(file);
  const total = pdf.numPages;
  if (total < 1) throw new Error('페이지가 없는 PDF입니다.');

  const out = await PDFDocument.create();
  const safeScale = Math.min(2.5, Math.max(0.5, scale));
  const safeQuality = Math.min(0.95, Math.max(0.3, quality));

  try {
    for (let i = 1; i <= total; i++) {
      onProgress?.(`압축 중… (${i}/${total})`);
      const canvas = await renderPdfPageToCanvas(pdf, i, safeScale);
      const blob = await canvasToBlob(canvas, 'image/jpeg', safeQuality);
      const bytes = await blob.arrayBuffer();
      const image = await out.embedJpg(bytes);
      const page = out.addPage([image.width, image.height]);
      page.drawImage(image, {x: 0, y: 0, width: image.width, height: image.height});
    }
  } finally {
    await pdf.destroy();
  }

  return pdfBlob(await out.save());
}

export async function zipFiles(files: {blob: Blob; name: string}[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.blob);
  }
  return zip.generateAsync({type: 'blob', compression: 'DEFLATE'});
}
