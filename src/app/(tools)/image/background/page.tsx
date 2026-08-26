import ImageBackgroundTool from '@/components/tool/image-background-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/background/');

export default function Page() {
  return <ImageBackgroundTool />;
}
