import type {Metadata} from 'next';
import PdfRotateTool from '@/components/tool/pdf-rotate-tool';

export const metadata: Metadata = {title: '페이지 회전'};

export default function Page() {
  return <PdfRotateTool />;
}
