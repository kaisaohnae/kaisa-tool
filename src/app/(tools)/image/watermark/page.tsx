import ImageWatermarkTool from '@/components/tool/image-watermark-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/watermark/');

export default function Page() {
  return <ImageWatermarkTool />;
}
