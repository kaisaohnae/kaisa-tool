import PdfStampTool from '@/components/tool/pdf-stamp-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/stamp/');

export default function Page() {
  return <PdfStampTool />;
}
