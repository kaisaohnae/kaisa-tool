import type {Metadata} from 'next';
import ImageBackgroundTool from '@/components/tool/image-background-tool';

export const metadata: Metadata = {title: '배경'};

export default function Page() {
  return <ImageBackgroundTool />;
}
