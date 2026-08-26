import ImageConvertTool from '@/components/tool/image-convert-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/image/jpg-to-png/');

export default function Page() {
  return <ImageConvertTool title="JPG → PNG" description="Convert JPG to PNG." accept="image/jpeg,.jpg,.jpeg" target="image/png" ext="png" />;
}
