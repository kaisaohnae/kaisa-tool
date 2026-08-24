import type {Metadata} from 'next';
import ImageConvertTool from '@/components/tool/image-convert-tool';

export const metadata: Metadata = {title: 'JPG → PNG'};

export default function Page() {
  return <ImageConvertTool title="JPG → PNG" description="JPG 이미지를 PNG로 변환합니다." accept="image/jpeg,.jpg,.jpeg" target="image/png" ext="png" />;
}
