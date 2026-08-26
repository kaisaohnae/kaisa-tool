import LoremTool from '@/components/tool/lorem-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/util/lorem/');

export default function Page() {
  return <LoremTool />;
}
