import TimestampTool from '@/components/tool/timestamp-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/util/timestamp/');

export default function Page() {
  return <TimestampTool />;
}
