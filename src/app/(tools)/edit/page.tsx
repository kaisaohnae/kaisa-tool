import CategoryHub from '@/components/layout/category-hub';
import {categoryPageMetadata} from '@/lib/seo';

export const metadata = categoryPageMetadata('edit');

export default function EditIndexPage() {
  return <CategoryHub category="edit" />;
}
