import type {Metadata} from 'next';
import ImageCropTool from '@/components/tool/image-crop-tool';

export const metadata: Metadata = {title: '자르기'};

export default function Page() {
  return <ImageCropTool />;
}
