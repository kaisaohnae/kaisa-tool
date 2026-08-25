import type {Metadata} from 'next';
import ImageRotateTool from '@/components/tool/image-rotate-tool';

export const metadata: Metadata = {title: '회전·뒤집기'};

export default function Page() {
  return <ImageRotateTool />;
}
