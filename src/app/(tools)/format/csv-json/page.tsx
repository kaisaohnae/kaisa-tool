import type {Metadata} from 'next';
import CsvJsonTool from '@/components/tool/csv-json-tool';

export const metadata: Metadata = {title: 'CSV↔JSON'};

export default function Page() {
  return <CsvJsonTool />;
}
