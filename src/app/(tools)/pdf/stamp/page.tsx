import type {Metadata} from 'next';
import PdfStampTool from '@/components/tool/pdf-stamp-tool';

export const metadata: Metadata = {title: '이미지 삽입'};

export default function Page() {
  return <PdfStampTool />;
}
