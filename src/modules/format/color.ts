export type Rgb = {r: number; g: number; b: number};
export type Hsl = {h: number; s: number; l: number};

export type ColorValue = {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  rgbString: string;
  hslString: string;
};

export type ColorParseResult = {ok: true; color: ColorValue} | {ok: false; error: string};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round(n: number, digits = 0): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

export function rgbToHex({r, g, b}: Rgb): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function hexToRgb(hex: string): Rgb | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

export function rgbToHsl({r, g, b}: Rgb): Hsl {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return {h: 0, s: 0, l: round(l * 100, 1)};

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (max === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;

  return {h: round(h * 360, 1), s: round(s * 100, 1), l: round(l * 100, 1)};
}

export function hslToRgb({h, s, l}: Hsl): Rgb {
  const H = ((h % 360) + 360) % 360;
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;

  if (S === 0) {
    const v = Math.round(L * 255);
    return {r: v, g: v, b: v};
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let T = t;
    if (T < 0) T += 1;
    if (T > 1) T -= 1;
    if (T < 1 / 6) return p + (q - p) * 6 * T;
    if (T < 1 / 2) return q;
    if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
    return p;
  };

  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hk = H / 360;

  return {
    r: Math.round(hue2rgb(p, q, hk + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hk) * 255),
    b: Math.round(hue2rgb(p, q, hk - 1 / 3) * 255)
  };
}

function fromRgb(rgb: Rgb): ColorValue {
  const hsl = rgbToHsl(rgb);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl,
    rgbString: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  };
}

export function parseColor(input: string): ColorParseResult {
  const text = input.trim();
  if (!text) return {ok: false, error: 'Enter a color.'};

  if (text.startsWith('#')) {
    const rgb = hexToRgb(text);
    if (!rgb) return {ok: false, error: 'Invalid HEX. (#RGB or #RRGGBB)'};
    return {ok: true, color: fromRgb(rgb)};
  }

  const rgbMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(text);
  if (rgbMatch) {
    const rgb = {
      r: clamp(Math.round(Number(rgbMatch[1])), 0, 255),
      g: clamp(Math.round(Number(rgbMatch[2])), 0, 255),
      b: clamp(Math.round(Number(rgbMatch[3])), 0, 255)
    };
    return {ok: true, color: fromRgb(rgb)};
  }

  const hslMatch = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(text);
  if (hslMatch) {
    const hsl = {
      h: Number(hslMatch[1]),
      s: Number(hslMatch[2]),
      l: Number(hslMatch[3])
    };
    return {ok: true, color: fromRgb(hslToRgb(hsl))};
  }

  if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(text)) {
    const rgb = hexToRgb(`#${text}`);
    if (rgb) return {ok: true, color: fromRgb(rgb)};
  }

  return {ok: false, error: 'Supports HEX, rgb(), and hsl().'};
}

export function relativeLuminance({r, g, b}: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return round((lighter + 0.05) / (darker + 0.05), 2);
}

export function suggestTextColor(bg: Rgb): '#FFFFFF' | '#000000' {
  const white = contrastRatio(bg, {r: 255, g: 255, b: 255});
  const black = contrastRatio(bg, {r: 0, g: 0, b: 0});
  return white >= black ? '#FFFFFF' : '#000000';
}

export const WHITE: Rgb = {r: 255, g: 255, b: 255};
export const BLACK: Rgb = {r: 0, g: 0, b: 0};
