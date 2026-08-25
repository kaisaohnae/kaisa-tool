import type {Metadata} from 'next';
import UnitTool from '@/components/tool/unit-tool';

export const metadata: Metadata = {title: '단위 변환'};

export default function Page() {
  return <UnitTool />;
}
