import type {Metadata} from 'next';
import RegexTool from '@/components/tool/regex-tool';

export const metadata: Metadata = {title: '정규식'};

export default function Page() {
  return <RegexTool />;
}
