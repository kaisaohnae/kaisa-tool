'use client';

import Link from 'next/link';
import IconLogo from '@/components/icons/icon-logo';
import Menu from '@/components/layout/menu';
import ThemeToggle from '@/components/layout/theme-toggle';

export default function Header() {
  return (
    <header id="header" className="header--sub">
      <div className="site-shell site-shell--header">
        <div className="header__inner site-shell__inner">
          <h1 className="header__logo">
            <Link href="/image/compress/" aria-label="Kaisa Tool Home">
              <IconLogo width={100} height={42} />
            </Link>
          </h1>
          <div className="header__actions">
            <Menu />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
