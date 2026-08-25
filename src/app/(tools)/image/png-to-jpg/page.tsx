import type {Metadata} from 'next';
import ImageConvertTool from '@/components/tool/image-convert-tool';

export const metadata: Metadata = {title: 'PNG → JPG'};

export default function Page() {
  return <ImageConvertTool title="PNG → JPG" description="Convert PNG to JPG. Transparent backgrounds become white." accept="image/png,.png" target="image/jpeg" ext="jpg" />;
}
