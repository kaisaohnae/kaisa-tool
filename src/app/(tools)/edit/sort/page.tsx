import type {Metadata} from 'next';
import SortLinesTool from '@/components/tool/sort-lines-tool';

export const metadata: Metadata = {title: '줄 정렬'};

export default function Page() {
  return <SortLinesTool />;
}
