import Link from 'next/link';
import {TOOL_CATEGORIES} from '@/data/tools';

export default function Page() {
  return (
    <div className="site-shell">
      <div className="site-shell__inner">
        <section className="home">
          <h1 className="home__title">Tools</h1>
          <p className="home__desc">이미지와 PDF를 브라우저에서 바로 처리합니다. 파일은 서버로 보내지 않습니다.</p>
          <div className="home__links">
            {TOOL_CATEGORIES.map(category => (
              <Link key={category.id} href={`/${category.id}/`} className="home__link">
                <span className="home__link-label">{category.label}</span>
                <span className="home__link-meta">{category.description}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
