import type {Metadata} from 'next';
import UuidTool from '@/components/tool/uuid-tool';

export const metadata: Metadata = {title: 'UUID'};

export default function Page() {
  return <UuidTool />;
}
