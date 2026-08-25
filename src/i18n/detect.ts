import type {Locale} from './types';

export const LOCALE_STORAGE_KEY = 'kaisa-locale';
export const COUNTRY_STORAGE_KEY = 'kaisa-country';
export const IP_STORAGE_KEY = 'kaisa-ip';

const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  US: 'en',
  KR: 'ko',
  CN: 'zh',
  IN: 'hi'
};

export const LOCALE_OPTIONS: {locale: Locale; country: string; flag: string; label: string}[] = [
  {locale: 'en', country: 'US', flag: '🇺🇸', label: 'English'},
  {locale: 'ko', country: 'KR', flag: '🇰🇷', label: '한국어'},
  {locale: 'zh', country: 'CN', flag: '🇨🇳', label: '中文'},
  {locale: 'hi', country: 'IN', flag: '🇮🇳', label: 'हिन्दी'}
];

export function countryToLocale(countryCode: string | undefined | null): Locale {
  if (!countryCode) return 'en';
  const code = countryCode.trim().toUpperCase();
  return COUNTRY_LOCALE_MAP[code] ?? 'en';
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function persistLocale(locale: Locale, country: string | null, ip?: string | null): void {
  writeSession(LOCALE_STORAGE_KEY, locale);
  if (country) writeSession(COUNTRY_STORAGE_KEY, country);
  else {
    try {
      sessionStorage.removeItem(COUNTRY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  if (ip) writeSession(IP_STORAGE_KEY, ip);
}

export function getStoredIp(): string | null {
  return readSession(IP_STORAGE_KEY);
}

export function getStoredCountry(): string | null {
  return readSession(COUNTRY_STORAGE_KEY);
}

export async function fetchGeo(): Promise<{country: string | null; ip: string | null}> {
  try {
    const res = await fetch('https://api.country.is/', {
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return {country: null, ip: null};
    const data = (await res.json()) as {country?: string; ip?: string};
    const country = typeof data.country === 'string' ? data.country.trim().toUpperCase() : '';
    const ip = typeof data.ip === 'string' ? data.ip.trim() : '';
    return {country: country || null, ip: ip || null};
  } catch {
    return {country: null, ip: null};
  }
}

/** @deprecated use fetchGeo */
export async function fetchCountryCode(): Promise<string | null> {
  const geo = await fetchGeo();
  return geo.country;
}

export async function resolveLocale(): Promise<{locale: Locale; country: string | null; ip: string | null}> {
  const cachedLocale = readSession(LOCALE_STORAGE_KEY) as Locale | null;
  const cachedCountry = readSession(COUNTRY_STORAGE_KEY);
  const cachedIp = readSession(IP_STORAGE_KEY);

  if (cachedLocale === 'en' || cachedLocale === 'ko' || cachedLocale === 'zh' || cachedLocale === 'hi') {
    if (!cachedIp) {
      const geo = await fetchGeo();
      if (geo.ip) writeSession(IP_STORAGE_KEY, geo.ip);
      return {locale: cachedLocale, country: cachedCountry || geo.country, ip: geo.ip || cachedIp};
    }
    return {locale: cachedLocale, country: cachedCountry, ip: cachedIp};
  }

  const geo = await fetchGeo();
  const locale = countryToLocale(geo.country);
  persistLocale(locale, geo.country, geo.ip);
  return {locale, country: geo.country, ip: geo.ip};
}
