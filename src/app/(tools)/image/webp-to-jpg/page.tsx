import type {Metadata} from 'next';
import ImageConvertTool from '@/components/tool/image-convert-tool';

export const metadata: Metadata = {title: 'WebP → JPG'};

export default function Page() {
  return <ImageConvertTool title="WebP → JPG" description="WebP 이미지를 JPG로 변환합니다." accept="image/webp,.webp" target="image/jpeg" ext="jpg" />;
}
