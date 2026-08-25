import type {Metadata} from 'next';
import ReplaceTool from '@/components/tool/replace-tool';

export const metadata: Metadata = {title: '찾기·바꾸기'};

export default function Page() {
  return <ReplaceTool />;
}
