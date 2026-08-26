import CategoryHub from '@/components/layout/category-hub';
import {categoryPageMetadata} from '@/lib/seo';

export const metadata = categoryPageMetadata('util');

export default function UtilIndexPage() {
  return <CategoryHub category="util" />;
}
