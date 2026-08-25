export type DedupeSeparator = 'newline' | 'comma' | 'semicolon' | 'space';

export type DedupeOptions = {
  separator: DedupeSeparator;
  trim: boolean;
  ignoreCase: boolean;
  ignoreEmpty: boolean;
  sort: boolean;
};

export type DedupeResult = {
  output: string;
  originalCount: number;
  uniqueCount: number;
  removedCount: number;
};

function splitText(text: string, separator: DedupeSeparator): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (separator === 'newline') return normalized.split('\n');
  if (separator === 'comma') return normalized.split(',');
  if (separator === 'semicolon') return normalized.split(';');
  return normalized.split(/\s+/).filter((_, i, arr) => !(arr.length === 1 && arr[0] === ''));
}

function joinParts(parts: string[], separator: DedupeSeparator): string {
  if (separator === 'newline') return parts.join('\n');
  if (separator === 'comma') return parts.join(', ');
  if (separator === 'semicolon') return parts.join('; ');
  return parts.join(' ');
}

export function dedupeText(text: string, options: DedupeOptions): DedupeResult {
  const parts = splitText(text, options.separator);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const part of parts) {
    let value = options.trim ? part.trim() : part;
    if (options.ignoreEmpty && value === '') continue;

    const key = options.ignoreCase ? value.toLowerCase() : value;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(options.trim ? value : part);
  }

  const resultParts = options.sort
    ? [...unique].sort((a, b) => a.localeCompare(b, undefined, {sensitivity: options.ignoreCase ? 'base' : 'variant'}))
    : unique;

  const keptEmptyAware = parts.filter(part => {
    const value = options.trim ? part.trim() : part;
    return !(options.ignoreEmpty && value === '');
  });

  return {
    output: joinParts(resultParts, options.separator),
    originalCount: keptEmptyAware.length,
    uniqueCount: resultParts.length,
    removedCount: Math.max(0, keptEmptyAware.length - resultParts.length)
  };
}
