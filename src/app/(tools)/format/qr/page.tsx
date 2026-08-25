import type {Metadata} from 'next';
import QrCodeTool from '@/components/tool/qr-code-tool';

export const metadata: Metadata = {title: 'QR 코드'};

export default function Page() {
  return <QrCodeTool />;
}
