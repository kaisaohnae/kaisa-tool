import Redirect from '@/components/redirect';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/compress/');

export default function ImageIndexPage() {
  return <Redirect href="/image/compress/" />;
}
