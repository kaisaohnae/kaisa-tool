import PdfMetadataTool from '@/components/tool/pdf-metadata-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/metadata/');

export default function Page() {
  return <PdfMetadataTool />;
}
