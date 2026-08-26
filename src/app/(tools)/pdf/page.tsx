import Redirect from '@/components/redirect';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/pdf/compress/');

export default function PdfIndexPage() {
  return <Redirect href="/pdf/compress/" />;
}
