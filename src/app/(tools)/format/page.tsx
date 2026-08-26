import Redirect from '@/components/redirect';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/json/');

export default function FormatIndexPage() {
  return <Redirect href="/format/json/" />;
}
