import type {Metadata} from 'next';
import ImageFaviconTool from '@/components/tool/image-favicon-tool';

export const metadata: Metadata = {title: 'Favicon'};

export default function Page() {
  return <ImageFaviconTool />;
}
