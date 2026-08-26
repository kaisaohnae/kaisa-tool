import CsvJsonTool from '@/components/tool/csv-json-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/csv-json/');

export default function Page() {
  return <CsvJsonTool />;
}
