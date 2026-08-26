import PdfToJpgTool from '@/components/tool/pdf-to-jpg-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/pdf-to-jpg/');

export default function Page() {
  return <PdfToJpgTool />;
}
