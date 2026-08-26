import ColorTool from '@/components/tool/color-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/color/');

export default function Page() {
  return <ColorTool />;
}
