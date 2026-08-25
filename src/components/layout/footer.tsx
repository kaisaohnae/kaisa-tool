'use client';

import {LOCALE_OPTIONS} from '@/i18n/detect';
import {useLocale, useSetLocale} from '@/i18n/locale-context';

export default function Footer() {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <footer id="footer" className="site-footer">
      <div className="site-shell">
        <div className="site-footer__inner site-shell__inner">
          <p className="site-footer__copy">
            © 2005 Kaisa ·{' '}
            <a href="https://kaisa.co.kr" className="site-footer__copy-link" target="_blank" rel="noopener noreferrer">
              kaisa.co.kr
            </a>
            . All Rights Reserved.
          </p>
          <div className="site-footer__aside">
            <div className="site-footer__langs" role="group" aria-label="Language">
              {LOCALE_OPTIONS.map(option => {
                const active = locale === option.locale;
                return (
                  <button
                    key={option.locale}
                    type="button"
                    className={active ? 'site-footer__lang site-footer__lang--active' : 'site-footer__lang'}
                    aria-pressed={active}
                    onClick={() => setLocale(option.locale, option.country)}
                  >
                    {option.locale.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <a href="mailto:kaisa@kaisa.co.kr" className="site-footer__link">
              kaisa@kaisa.co.kr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
