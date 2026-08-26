import SqlFormatTool from '@/components/tool/sql-format-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/sql/');

export default function Page() {
  return <SqlFormatTool />;
}
