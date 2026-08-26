import PdfCompressTool from '@/components/tool/pdf-compress-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/compress/');

export default function Page() {
  return <PdfCompressTool />;
}
