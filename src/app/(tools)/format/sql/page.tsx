import type {Metadata} from 'next';
import SqlFormatTool from '@/components/tool/sql-format-tool';

export const metadata: Metadata = {title: 'SQL'};

export default function Page() {
  return <SqlFormatTool />;
}
