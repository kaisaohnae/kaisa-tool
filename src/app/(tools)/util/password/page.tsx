import type {Metadata} from 'next';
import PasswordTool from '@/components/tool/password-tool';

export const metadata: Metadata = {title: '비밀번호'};

export default function Page() {
  return <PasswordTool />;
}
