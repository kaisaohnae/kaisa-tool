import type {Metadata} from 'next';
import ImageConvertTool from '@/components/tool/image-convert-tool';

export const metadata: Metadata = {title: 'PNG → JPG'};

export default function Page() {
  return <ImageConvertTool title="PNG → JPG" description="PNG 이미지를 JPG로 변환합니다. 투명 배경은 흰색으로 처리됩니다." accept="image/png,.png" target="image/jpeg" ext="jpg" />;
}
