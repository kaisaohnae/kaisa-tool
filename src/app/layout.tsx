/**
 * @file 루트 레이아웃
 */
import type {Metadata} from 'next';
import {Syne, DM_Sans} from 'next/font/google';
import '@/assets/css/reset.css';
import '@/assets/css/styles.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import GoogleAnalytics from '@/components/layout/google-analytics';
import GoogleAdsense from '@/components/layout/google-adsense';
import ThemeProvider from '@/components/layout/theme-provider';
import {LocaleProvider} from '@/i18n/locale-context';
import {THEME_STORAGE_KEY} from '@/store/use-theme-store';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    default: 'Kaisa Tool',
    template: '%s · Kaisa Tool'
  },
  description: 'Browser-based image and PDF utilities — process files locally without a server.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <GoogleAdsense />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=null;document.cookie.split(';').forEach(function(c){var p=c.trim().split('=');if(p[0]==='${THEME_STORAGE_KEY}')t=decodeURIComponent(p[1]||'');});document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`
          }}
        />
        <GoogleAnalytics />
        <ThemeProvider />
        <LocaleProvider>
          <Header />
          <main className="site-main">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
