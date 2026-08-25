export type PasswordCharset = {
  upper: boolean;
  lower: boolean;
  digit: boolean;
  symbol: boolean;
  excludeSimilar: boolean;
};

export type PasswordOptions = {
  length: number;
  count: number;
  charset: PasswordCharset;
};

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export type PasswordResult = {
  passwords: string[];
  strength: PasswordStrength;
  entropyBits: number;
  error?: string;
};

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGIT = '0123456789';
const SYMBOL = '!@#$%^&*()-_=+[]{};:,.?/';
const SIMILAR = /[0OIl1]/g;

function buildAlphabet(charset: PasswordCharset): string {
  let chars = '';
  if (charset.upper) chars += UPPER;
  if (charset.lower) chars += LOWER;
  if (charset.digit) chars += DIGIT;
  if (charset.symbol) chars += SYMBOL;
  if (charset.excludeSimilar) chars = chars.replace(SIMILAR, '');
  return chars;
}

function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function estimateStrength(length: number, alphabetSize: number): {strength: PasswordStrength; entropyBits: number} {
  const entropyBits = alphabetSize > 0 ? Math.log2(alphabetSize) * length : 0;
  let strength: PasswordStrength = 'weak';
  if (entropyBits >= 80) strength = 'strong';
  else if (entropyBits >= 60) strength = 'good';
  else if (entropyBits >= 40) strength = 'fair';
  return {strength, entropyBits: Math.round(entropyBits * 10) / 10};
}

export function generatePasswords(options: PasswordOptions): PasswordResult {
  const length = Math.min(128, Math.max(4, Math.floor(options.length) || 16));
  const count = Math.min(50, Math.max(1, Math.floor(options.count) || 1));
  const alphabet = buildAlphabet(options.charset);

  if (!alphabet) {
    return {passwords: [], strength: 'weak', entropyBits: 0, error: 'Select at least one character set.'};
  }

  const passwords: string[] = [];
  for (let i = 0; i < count; i++) {
    let pwd = '';
    for (let j = 0; j < length; j++) {
      pwd += alphabet[randomInt(alphabet.length)];
    }
    passwords.push(pwd);
  }

  const {strength, entropyBits} = estimateStrength(length, alphabet.length);
  return {passwords, strength, entropyBits};
}

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong'
};
