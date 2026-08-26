import CategoryHub from '@/components/layout/category-hub';
import {categoryPageMetadata} from '@/lib/seo';

export const metadata = categoryPageMetadata('pdf');

export default function PdfIndexPage() {
  return <CategoryHub category="pdf" />;
}
