import ImageConvertTool from '@/components/tool/image-convert-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/png-to-jpg/');

export default function Page() {
  return <ImageConvertTool title="PNG → JPG" description="Convert PNG to JPG. Transparent backgrounds become white." accept="image/png,.png" target="image/jpeg" ext="jpg" />;
}
