import CompareTool from '@/components/tool/compare-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/compare/');

export default function Page() {
  return <CompareTool />;
}
