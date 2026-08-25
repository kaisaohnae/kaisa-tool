import type {Metadata} from 'next';
import ColorTool from '@/components/tool/color-tool';

export const metadata: Metadata = {title: '색상'};

export default function Page() {
  return <ColorTool />;
}
