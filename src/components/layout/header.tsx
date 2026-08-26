'use client';

import {useEffect, useId, useRef, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import IconLogo from '@/components/icons/icon-logo';
import ThemeToggle from '@/components/layout/theme-toggle';
import {useT} from '@/i18n/locale-context';

const MENU_ITEMS = [
  {href: '/image/', label: 'Image', match: '/image'},
  {href: '/pdf/', label: 'PDF', match: '/pdf'},
  {href: '/format/', label: 'FORMAT', match: '/format'},
  {href: '/edit/', label: 'EDIT', match: '/edit'},
  {href: '/util/', label: 'UTIL', match: '/util'}
];

export default function Header() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const navId = useId();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && headerRef.current && !headerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const items = MENU_ITEMS.map(item => {
    const isActive = pathname === item.match || pathname.startsWith(`${item.match}/`);
    return (
      <li key={item.href} className={isActive ? 'menu__item menu__item--active' : 'menu__item'}>
        <Link href={item.href} className="menu__link" aria-current={isActive ? 'page' : undefined}>
          {t(item.label)}
        </Link>
      </li>
    );
  });

  const toggle = (
    <button
      type="button"
      className={open ? 'menu__toggle menu__toggle--open' : 'menu__toggle'}
      aria-expanded={open}
      aria-controls={navId}
      aria-label={open ? t('Close menu') : t('Open menu')}
      onClick={() => setOpen(v => !v)}
    >
      <span className="menu__toggle-icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );

  return (
    <header
      id="header"
      ref={headerRef}
      className={open ? 'header--sub header--nav-open' : 'header--sub'}
    >
      <div className="site-shell site-shell--header">
        <div className="header__top site-shell__inner">
          <p className="header__logo">
            <Link href="/" aria-label="Kaisa Tool Home">
              <IconLogo width={100} height={42} />
            </Link>
          </p>
          <div className="header__actions">
            <nav className="menu menu--desktop" aria-label={t('Main navigation')}>
              <ul className="menu__list">{items}</ul>
            </nav>
            <ThemeToggle />
            {toggle}
          </div>
        </div>

        <nav id={navId} className="header__nav" aria-label={t('Mobile navigation')} hidden={!open}>
          <div className="site-shell__inner header__nav-inner">
            <ul className="menu__list menu__list--mobile">{items}</ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
