import ReplaceTool from '@/components/tool/replace-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/edit/replace/');

export default function Page() {
  return <ReplaceTool />;
}
