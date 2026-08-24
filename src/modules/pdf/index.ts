import {PDFDocument} from 'pdf-lib';
import JSZip from 'jszip';
import {canvasToBlob} from '@/modules/shared/file';

function pdfBlob(data: Uint8Array): Blob {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy], {type: 'application/pdf'});
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => out.addPage(page));
  }
  return pdfBlob(await out.save());
}

export async function splitPdf(file: File): Promise<{blob: Blob; name: string}[]> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const base = file.name.replace(/\.pdf$/i, '');
  const results: {blob: Blob; name: string}[] = [];

  for (let i = 0; i < src.getPageCount(); i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    results.push({
      blob: pdfBlob(await doc.save()),
      name: `${base}-p${i + 1}.pdf`
    });
  }
  return results;
}

export async function jpgToPdf(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const image = await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {x: 0, y: 0, width: image.width, height: image.height});
  }
  return pdfBlob(await doc.save());
}

export async function pdfToJpg(file: File, quality = 0.85, scale = 2): Promise<{blob: Blob; name: string}[]> {
  const {loadPdfDocument, renderPdfPageToCanvas} = await import('@/modules/pdf/pdfjs');
  const pdf = await loadPdfDocument(file);
  const base = file.name.replace(/\.pdf$/i, '');
  const results: {blob: Blob; name: string}[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdf, i, scale);
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    results.push({blob, name: `${base}-p${i}.jpg`});
  }
  return results;
}

export async function compressPdf(file: File, quality = 0.7, scale = 1.2): Promise<Blob> {
  const {loadPdfDocument, renderPdfPageToCanvas} = await import('@/modules/pdf/pdfjs');
  const pdf = await loadPdfDocument(file);
  const out = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdf, i, scale);
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    const bytes = await blob.arrayBuffer();
    const image = await out.embedJpg(bytes);
    const page = out.addPage([image.width, image.height]);
    page.drawImage(image, {x: 0, y: 0, width: image.width, height: image.height});
  }

  return pdfBlob(await out.save());
}

export async function zipFiles(files: {blob: Blob; name: string}[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.blob);
  }
  return zip.generateAsync({type: 'blob'});
}
