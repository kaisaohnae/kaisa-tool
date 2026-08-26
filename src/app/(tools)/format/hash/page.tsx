import HashTool from '@/components/tool/hash-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/hash/');

export default function Page() {
  return <HashTool />;
}
