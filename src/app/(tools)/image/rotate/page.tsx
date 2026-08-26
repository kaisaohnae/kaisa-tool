import ImageRotateTool from '@/components/tool/image-rotate-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/rotate/');

export default function Page() {
  return <ImageRotateTool />;
}
