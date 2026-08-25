import type {Metadata} from 'next';
import HashTool from '@/components/tool/hash-tool';

export const metadata: Metadata = {title: '해시'};

export default function Page() {
  return <HashTool />;
}
