import type {Metadata} from 'next';
import PdfMetadataTool from '@/components/tool/pdf-metadata-tool';

export const metadata: Metadata = {title: '메타데이터'};

export default function Page() {
  return <PdfMetadataTool />;
}
