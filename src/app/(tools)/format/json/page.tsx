import JsonFormatTool from '@/components/tool/json-format-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/json/');

export default function Page() {
  return <JsonFormatTool />;
}
