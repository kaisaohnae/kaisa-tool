import type {Metadata} from 'next';
import ImageResizeTool from '@/components/tool/image-resize-tool';

export const metadata: Metadata = {title: '이미지 사이즈 변경'};

export default function Page() {
  return <ImageResizeTool />;
}
