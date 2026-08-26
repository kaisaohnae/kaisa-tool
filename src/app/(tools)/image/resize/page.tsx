import ImageResizeTool from '@/components/tool/image-resize-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/resize/');

export default function Page() {
  return <ImageResizeTool />;
}
