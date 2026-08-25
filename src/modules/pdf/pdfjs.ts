export async function loadPdfDocument(file: File | ArrayBuffer) {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/pdf.worker.min.mjs`;
  }
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const task = pdfjs.getDocument({data, useSystemFonts: true});
  return task.promise;
}

export async function renderPdfPageToCanvas(
  pdf: Awaited<ReturnType<typeof loadPdfDocument>>,
  pageNumber: number,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({scale});
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas를 사용할 수 없습니다.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({canvasContext: ctx, viewport, canvas}).promise;
  return canvas;
}
