import type {Metadata} from 'next';
import JsonFormatTool from '@/components/tool/json-format-tool';

export const metadata: Metadata = {title: 'JSON'};

export default function Page() {
  return <JsonFormatTool />;
}
