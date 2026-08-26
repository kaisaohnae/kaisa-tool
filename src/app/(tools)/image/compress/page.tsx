import ImageCompressTool from '@/components/tool/image-compress-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/compress/');

export default function Page() {
  return <ImageCompressTool />;
}
