import SortLinesTool from '@/components/tool/sort-lines-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/sort/');

export default function Page() {
  return <SortLinesTool />;
}
