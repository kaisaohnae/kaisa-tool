import type {Metadata} from 'next';
import SlugTool from '@/components/tool/slug-tool';

export const metadata: Metadata = {title: '슬러그'};

export default function Page() {
  return <SlugTool />;
}
