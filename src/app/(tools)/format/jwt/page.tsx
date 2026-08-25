import type {Metadata} from 'next';
import JwtTool from '@/components/tool/jwt-tool';

export const metadata: Metadata = {title: 'JWT'};

export default function Page() {
  return <JwtTool />;
}
