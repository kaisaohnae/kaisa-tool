import {PDFDocument} from 'pdf-lib';

export interface PdfMetadataFields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
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

function formatDate(d: Date | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateInput(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date format.');
  return d;
}

export async function readPdfMetadata(file: File): Promise<PdfMetadataFields> {
  const doc = await loadPdf(await file.arrayBuffer());
  let creationDate = '';
  let modificationDate = '';
  try {
    creationDate = formatDate(doc.getCreationDate());
  } catch {
    creationDate = '';
  }
  try {
    modificationDate = formatDate(doc.getModificationDate());
  } catch {
    modificationDate = '';
  }

  return {
    title: doc.getTitle() ?? '',
    author: doc.getAuthor() ?? '',
    subject: doc.getSubject() ?? '',
    keywords: doc.getKeywords() ?? '',
    creator: doc.getCreator() ?? '',
    producer: doc.getProducer() ?? '',
    creationDate,
    modificationDate
  };
}

export async function writePdfMetadata(file: File, fields: PdfMetadataFields): Promise<Blob> {
  const doc = await loadPdf(await file.arrayBuffer());

  doc.setTitle(fields.title.trim());
  doc.setAuthor(fields.author.trim());
  doc.setSubject(fields.subject.trim());
  doc.setKeywords(
    fields.keywords
      .split(/[,，]/)
      .map(k => k.trim())
      .filter(Boolean)
  );
  doc.setCreator(fields.creator.trim());
  doc.setProducer(fields.producer.trim());

  const created = parseDateInput(fields.creationDate);
  if (created) doc.setCreationDate(created);
  const modified = parseDateInput(fields.modificationDate);
  if (modified) doc.setModificationDate(modified);
  else doc.setModificationDate(new Date());

  return pdfBlob(await doc.save());
}
