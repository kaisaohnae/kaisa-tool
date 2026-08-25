import type {Metadata} from 'next';
import TimestampTool from '@/components/tool/timestamp-tool';

export const metadata: Metadata = {title: '타임스탬프'};

export default function Page() {
  return <TimestampTool />;
}
