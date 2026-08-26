import UuidTool from '@/components/tool/uuid-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/util/uuid/');

export default function Page() {
  return <UuidTool />;
}
