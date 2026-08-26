import Base64Tool from '@/components/tool/base64-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/base64/');

export default function Page() {
  return <Base64Tool />;
}
