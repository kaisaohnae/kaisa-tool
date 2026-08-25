export type HangulMode = 'keep' | 'remove' | 'romanize';

export type SlugOptions = {
  separator: string;
  hangul: HangulMode;
  maxLength?: number;
};

const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];
const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];
const JONG = [
  '', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss',
  'ng', 'j', 'ch', 'k', 't', 'p', 'h'
];

function romanizeSyllable(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return ch;
  const s = code - 0xac00;
  const cho = Math.floor(s / 588);
  const jung = Math.floor((s % 588) / 28);
  const jong = s % 28;
  return CHO[cho] + JUNG[jung] + JONG[jong];
}

function romanizeHangul(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    out += code >= 0xac00 && code <= 0xd7a3 ? romanizeSyllable(ch) : ch;
  }
  return out;
}

export function slugify(text: string, options: SlugOptions): string {
  const sep = options.separator || '-';
  let value = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  if (options.hangul === 'romanize') {
    value = romanizeHangul(value);
  } else if (options.hangul === 'remove') {
    value = value.replace(/[\uac00-\ud7a3]/g, ' ');
  }

  value = value.toLowerCase();

  const allowed =
    options.hangul === 'keep'
      ? new RegExp(`[^a-z0-9가-힣]+`, 'g')
      : /[^a-z0-9]+/g;

  value = value.replace(allowed, sep).replace(new RegExp(`${escapeRegExp(sep)}{2,}`, 'g'), sep);
  value = value.replace(new RegExp(`^${escapeRegExp(sep)}+|${escapeRegExp(sep)}+$`, 'g'), '');

  if (options.maxLength && options.maxLength > 0 && value.length > options.maxLength) {
    value = value.slice(0, options.maxLength).replace(new RegExp(`${escapeRegExp(sep)}+$`), '');
  }

  return value;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
