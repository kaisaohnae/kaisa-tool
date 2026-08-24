import type {Metadata} from 'next';
import PdfCompressTool from '@/components/tool/pdf-compress-tool';

export const metadata: Metadata = {title: 'PDF 압축'};

export default function Page() {
  return <PdfCompressTool />;
}
