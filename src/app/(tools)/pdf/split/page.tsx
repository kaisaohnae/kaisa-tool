import type {Metadata} from 'next';
import PdfSplitTool from '@/components/tool/pdf-split-tool';

export const metadata: Metadata = {title: 'PDF 분할'};

export default function Page() {
  return <PdfSplitTool />;
}
