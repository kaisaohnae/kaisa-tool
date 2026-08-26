import SlugTool from '@/components/tool/slug-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/slug/');

export default function Page() {
  return <SlugTool />;
}
