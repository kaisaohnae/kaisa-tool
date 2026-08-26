import ImageCropTool from '@/components/tool/image-crop-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/crop/');

export default function Page() {
  return <ImageCropTool />;
}
