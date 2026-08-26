import MarkdownTool from '@/components/tool/markdown-tool';
import {toolPageMetadata} from '@/lib/seo';

export const metadata = toolPageMetadata('/format/markdown/');

export default function Page() {
  return <MarkdownTool />;
}
