import type {Metadata} from 'next';
import JpgToPdfTool from '@/components/tool/jpg-to-pdf-tool';

export const metadata: Metadata = {title: 'JPG → PDF'};

export default function Page() {
  return <JpgToPdfTool />;
}
