import RegexTool from '@/components/tool/regex-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/regex/');

export default function Page() {
  return <RegexTool />;
}
