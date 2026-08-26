import DedupeTool from '@/components/tool/dedupe-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/dedupe/');

export default function Page() {
  return <DedupeTool />;
}
