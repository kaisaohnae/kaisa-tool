import type {Metadata} from 'next';
import ImageConvertTool from '@/components/tool/image-convert-tool';

export const metadata: Metadata = {title: 'JPG → PNG'};

export default function Page() {
  return <ImageConvertTool title="JPG → PNG" description="Convert JPG to PNG." accept="image/jpeg,.jpg,.jpeg" target="image/png" ext="png" />;
}
