import PdfMergeTool from '@/components/tool/pdf-merge-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/merge/');

export default function Page() {
  return <PdfMergeTool />;
}
