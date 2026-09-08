import type {Metadata} from 'next';
import PhotoEditor from '@/components/photo/photo-editor';
import '@/assets/css/photo.css';

export const metadata: Metadata = {
  title: 'Photo',
  description: 'Local image editor',
  robots: {
    index: false,
    follow: false
  }
};

export default function PhotoPage() {
  return <PhotoEditor />;
}
