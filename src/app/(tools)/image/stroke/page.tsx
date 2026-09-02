import ImageStrokeTool from '@/components/tool/image-stroke-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/stroke/');

export default function Page() {
  return <ImageStrokeTool />;
}
