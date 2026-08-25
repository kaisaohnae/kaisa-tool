import type {Metadata} from 'next';
import Base64Tool from '@/components/tool/base64-tool';

export const metadata: Metadata = {title: 'Base64'};

export default function Page() {
  return <Base64Tool />;
}
