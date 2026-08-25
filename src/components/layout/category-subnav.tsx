'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {getToolsByCategory, type ToolCategory} from '@/data/tools';
import {useT} from '@/i18n/locale-context';

export default function CategorySubnav({category}: {category: ToolCategory}) {
  const pathname = usePathname();
  const t = useT();
  const tools = getToolsByCategory(category);

  return (
    <nav className="subnav" aria-label={`${category} tools`}>
      <div className="site-shell">
        <div className="site-shell__inner">
          <ul className="subnav__list">
            {tools.map(tool => {
              const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
              const active = normalized === tool.href;
              return (
                <li key={tool.id}>
                  <Link href={tool.href} className={active ? 'subnav__link subnav__link--active' : 'subnav__link'}>
                    {t(tool.title)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
