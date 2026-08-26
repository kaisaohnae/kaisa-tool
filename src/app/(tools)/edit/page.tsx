import Redirect from '@/components/redirect';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/compare/');

export default function EditIndexPage() {
  return <Redirect href="/edit/compare/" />;
}
