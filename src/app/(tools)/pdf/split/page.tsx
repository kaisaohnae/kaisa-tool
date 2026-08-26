import PdfSplitTool from '@/components/tool/pdf-split-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/split/');

export default function Page() {
  return <PdfSplitTool />;
}
