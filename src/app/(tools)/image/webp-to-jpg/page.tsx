import type {Metadata} from 'next';
import ImageConvertTool from '@/components/tool/image-convert-tool';

export const metadata: Metadata = {title: 'WebP → JPG'};

export default function Page() {
  return <ImageConvertTool title="WebP → JPG" description="Convert WebP to JPG." accept="image/webp,.webp" target="image/jpeg" ext="jpg" />;
}
