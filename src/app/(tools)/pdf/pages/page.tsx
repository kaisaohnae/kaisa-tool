import PdfPagesTool from '@/components/tool/pdf-pages-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/pages/');

export default function Page() {
  return <PdfPagesTool />;
}
