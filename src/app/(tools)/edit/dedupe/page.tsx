import type {Metadata} from 'next';
import DedupeTool from '@/components/tool/dedupe-tool';

export const metadata: Metadata = {title: '중복제거'};

export default function Page() {
  return <DedupeTool />;
}
