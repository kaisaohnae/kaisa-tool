import CaseConvertTool from '@/components/tool/case-convert-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/case/');

export default function Page() {
  return <CaseConvertTool />;
}
