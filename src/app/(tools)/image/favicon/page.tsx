import ImageFaviconTool from '@/components/tool/image-favicon-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/favicon/');

export default function Page() {
  return <ImageFaviconTool />;
}
