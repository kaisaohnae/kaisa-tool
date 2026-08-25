import type {Metadata} from 'next';
import PdfPagesTool from '@/components/tool/pdf-pages-tool';

export const metadata: Metadata = {title: '페이지 편집'};

export default function Page() {
  return <PdfPagesTool />;
}
