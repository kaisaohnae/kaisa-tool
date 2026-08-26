import PdfRotateTool from '@/components/tool/pdf-rotate-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/rotate/');

export default function Page() {
  return <PdfRotateTool />;
}
