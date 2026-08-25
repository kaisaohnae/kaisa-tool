import type {Metadata} from 'next';
import LoremTool from '@/components/tool/lorem-tool';

export const metadata: Metadata = {title: '더미 텍스트'};

export default function Page() {
  return <LoremTool />;
}
