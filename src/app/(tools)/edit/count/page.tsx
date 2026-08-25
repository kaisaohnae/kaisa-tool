import type {Metadata} from 'next';
import CountTool from '@/components/tool/count-tool';

export const metadata: Metadata = {title: '글자 수'};

export default function Page() {
  return <CountTool />;
}
