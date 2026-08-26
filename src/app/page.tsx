import HomeHub from '@/components/layout/home-hub';
import {homePageMetadata} from '@/lib/seo';

export const metadata = homePageMetadata();

export default function Page() {
  return (
    <div className="site-shell">
      <div className="site-shell__inner site-main__body">
        <HomeHub />
      </div>
    </div>
  );
}
