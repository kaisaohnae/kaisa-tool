import UrlCodecTool from '@/components/tool/url-codec-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/url/');

export default function Page() {
  return <UrlCodecTool />;
}
