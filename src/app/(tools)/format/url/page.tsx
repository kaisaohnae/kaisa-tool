import type {Metadata} from 'next';
import UrlCodecTool from '@/components/tool/url-codec-tool';

export const metadata: Metadata = {title: 'URL'};

export default function Page() {
  return <UrlCodecTool />;
}
