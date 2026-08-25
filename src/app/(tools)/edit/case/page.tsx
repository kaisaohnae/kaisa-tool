import type {Metadata} from 'next';
import CaseConvertTool from '@/components/tool/case-convert-tool';

export const metadata: Metadata = {title: '대소문자'};

export default function Page() {
  return <CaseConvertTool />;
}
