export type Theme = 'light' | 'dark';

export const THEME_COOKIE_KEY = 'kaisa-tool-theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const isTheme = (value: string | null | undefined): value is Theme => value === 'light' || value === 'dark';

export function getThemeCookie(): Theme | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE_KEY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));

  if (!match) return null;

  const value = decodeURIComponent(match[1]);
  return isTheme(value) ? value : null;
}

export function setThemeCookie(theme: Theme) {
  if (typeof document === 'undefined') return;

  document.cookie = [`${THEME_COOKIE_KEY}=${encodeURIComponent(theme)}`, `max-age=${THEME_COOKIE_MAX_AGE}`, 'path=/', 'samesite=lax'].join('; ');
}

export function getStoredTheme(): Theme | null {
  const fromCookie = getThemeCookie();
  if (fromCookie) return fromCookie;

  if (typeof localStorage === 'undefined') return null;

  const fromStorage = localStorage.getItem(THEME_COOKIE_KEY);
  if (!isTheme(fromStorage)) return null;

  setThemeCookie(fromStorage);
  localStorage.removeItem(THEME_COOKIE_KEY);
  return fromStorage;
}
