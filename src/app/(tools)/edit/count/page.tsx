import CountTool from '@/components/tool/count-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/count/');

export default function Page() {
  return <CountTool />;
}
