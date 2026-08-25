import type {Metadata} from 'next';
import CompareTool from '@/components/tool/compare-tool';

export const metadata: Metadata = {title: 'Compare'};

export default function Page() {
  return <CompareTool />;
}
