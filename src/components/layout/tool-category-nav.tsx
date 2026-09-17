'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {TOOL_CATEGORIES} from '@/data/tools';
import {useT} from '@/i18n/locale-context';

const CATEGORY_HOME: Record<string, string> = {
  image: '/image/compress/', pdf: '/pdf/compress/', format: '/format/json/',
  edit: '/edit/compare/', util: '/util/password/'
};
export default function ToolCategoryNav() {
  const pathname = usePathname() || '/';
  const t = useT();
  return (
    <nav className="tool-category-nav" aria-label="Tool categories">
      <div className="site-shell"><div className="site-shell__inner">
        <ul className="tool-category-nav__list">
          {TOOL_CATEGORIES.map(category => {
            const active = pathname === '/' ? category.id === 'image' : pathname.startsWith('/' + category.id + '/');
            return <li key={category.id}><Link href={CATEGORY_HOME[category.id]} className={active ? 'tool-category-nav__link is-active' : 'tool-category-nav__link'} aria-current={active ? 'page' : undefined}>{t(category.label)}</Link></li>;
          })}
          <li><Link href="/photo/" className="tool-category-nav__link tool-category-nav__link--photo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
            <span>{t('Photo')}</span>
          </Link></li>
        </ul>
      </div></div>
    </nav>
  );
}
