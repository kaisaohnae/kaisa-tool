import QrCodeTool from '@/components/tool/qr-code-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/qr/');

export default function Page() {
  return <QrCodeTool />;
}
