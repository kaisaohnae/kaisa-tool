import CategoryHub from '@/components/layout/category-hub';
import {categoryPageMetadata} from '@/lib/seo';

export const metadata = categoryPageMetadata('image');

export default function ImageIndexPage() {
  return <CategoryHub category="image" />;
}
