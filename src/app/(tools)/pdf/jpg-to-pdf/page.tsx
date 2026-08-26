import JpgToPdfTool from '@/components/tool/jpg-to-pdf-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/jpg-to-pdf/');

export default function Page() {
  return <JpgToPdfTool />;
}
