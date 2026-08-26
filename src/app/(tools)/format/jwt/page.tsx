import JwtTool from '@/components/tool/jwt-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/jwt/');

export default function Page() {
  return <JwtTool />;
}
