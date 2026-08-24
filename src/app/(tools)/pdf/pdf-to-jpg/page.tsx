import type {Metadata} from 'next';
import PdfToJpgTool from '@/components/tool/pdf-to-jpg-tool';

export const metadata: Metadata = {title: 'PDF → JPG'};

export default function Page() {
  return <PdfToJpgTool />;
}
