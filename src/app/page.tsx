import Redirect from '@/components/redirect';
import {toolPageMetadata} from '@/lib/seo';

/** Site entry → first Image tool (no separate home hub). */
export const metadata = toolPageMetadata('/image/compress/');

export default function Page() {
  return <Redirect href="/image/compress/" />;
}
