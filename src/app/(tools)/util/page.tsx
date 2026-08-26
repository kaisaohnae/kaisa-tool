import Redirect from '@/components/redirect';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/util/password/');

export default function UtilIndexPage() {
  return <Redirect href="/util/password/" />;
}
