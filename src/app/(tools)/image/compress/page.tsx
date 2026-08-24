import type {Metadata} from 'next';
import ImageCompressTool from '@/components/tool/image-compress-tool';

export const metadata: Metadata = {title: '이미지 용량 줄이기'};

export default function Page() {
  return <ImageCompressTool />;
}
