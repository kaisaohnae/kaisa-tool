import type {Metadata} from 'next';
import PdfMergeTool from '@/components/tool/pdf-merge-tool';

export const metadata: Metadata = {title: 'PDF 합치기'};

export default function Page() {
  return <PdfMergeTool />;
}
