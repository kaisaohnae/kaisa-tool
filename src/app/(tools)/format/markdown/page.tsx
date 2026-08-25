import type {Metadata} from 'next';
import MarkdownTool from '@/components/tool/markdown-tool';

export const metadata: Metadata = {title: 'Markdown'};

export default function Page() {
  return <MarkdownTool />;
}
