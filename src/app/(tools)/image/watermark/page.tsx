import type {Metadata} from 'next';
import ImageWatermarkTool from '@/components/tool/image-watermark-tool';

export const metadata: Metadata = {title: '워터마크'};

export default function Page() {
  return <ImageWatermarkTool />;
}
