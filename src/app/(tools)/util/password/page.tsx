import PasswordTool from '@/components/tool/password-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/util/password/');

export default function Page() {
  return <PasswordTool />;
}
