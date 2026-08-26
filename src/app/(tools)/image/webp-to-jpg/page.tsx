import ImageConvertTool from '@/components/tool/image-convert-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/webp-to-jpg/');

export default function Page() {
  return <ImageConvertTool title="WebP → JPG" description="Convert WebP to JPG." accept="image/webp,.webp" target="image/jpeg" ext="jpg" />;
}
