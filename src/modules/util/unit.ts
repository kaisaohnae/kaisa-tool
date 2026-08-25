export type UnitCategory = 'pxrem' | 'bytes' | 'temperature' | 'length';

export type UnitConvertResult = {
  ok: boolean;
  value?: number;
  error?: string;
};

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
export type ByteUnit = (typeof BYTE_UNITS)[number];

const LENGTH_TO_M: Record<string, number> = {
  m: 1,
  cm: 0.01,
  mm: 0.001,
  km: 1000,
  in: 0.0254,
  ft: 0.3048
};

export type LengthUnit = keyof typeof LENGTH_TO_M;

export function convertPxRem(value: number, from: 'px' | 'rem', to: 'px' | 'rem', base = 16): UnitConvertResult {
  if (!Number.isFinite(value)) return {ok: false, error: 'Enter a valid number.'};
  const basePx = base > 0 ? base : 16;
  const px = from === 'px' ? value : value * basePx;
  const out = to === 'px' ? px : px / basePx;
  return {ok: true, value: out};
}

export function convertBytes(value: number, from: ByteUnit, to: ByteUnit): UnitConvertResult {
  if (!Number.isFinite(value)) return {ok: false, error: 'Enter a valid number.'};
  const fromPow = BYTE_UNITS.indexOf(from);
  const toPow = BYTE_UNITS.indexOf(to);
  const bytes = value * 1024 ** fromPow;
  return {ok: true, value: bytes / 1024 ** toPow};
}

export function convertTemperature(value: number, from: 'C' | 'F' | 'K', to: 'C' | 'F' | 'K'): UnitConvertResult {
  if (!Number.isFinite(value)) return {ok: false, error: 'Enter a valid number.'};

  let c = value;
  if (from === 'F') c = ((value - 32) * 5) / 9;
  if (from === 'K') c = value - 273.15;

  if (from === 'K' && value < 0) return {ok: false, error: 'Kelvin must be 0 or greater.'};

  let out = c;
  if (to === 'F') out = (c * 9) / 5 + 32;
  if (to === 'K') out = c + 273.15;
  return {ok: true, value: out};
}

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): UnitConvertResult {
  if (!Number.isFinite(value)) return {ok: false, error: 'Enter a valid number.'};
  const meters = value * LENGTH_TO_M[from];
  return {ok: true, value: meters / LENGTH_TO_M[to]};
}

export function formatUnitNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.abs(n) >= 1000 || Math.abs(n) < 0.001 ? n.toExponential(6) : Math.round(n * 1e10) / 1e10;
  return String(rounded);
}

export {BYTE_UNITS, LENGTH_TO_M};
