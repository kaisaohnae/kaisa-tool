import CategoryHub from '@/components/layout/category-hub';
import {categoryPageMetadata} from '@/lib/seo';

export const metadata = categoryPageMetadata('format');

export default function FormatIndexPage() {
  return <CategoryHub category="format" />;
}
