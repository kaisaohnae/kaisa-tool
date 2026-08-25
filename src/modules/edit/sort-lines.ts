export type SortMode = 'locale' | 'numeric' | 'length';

export type SortLinesOptions = {
  mode: SortMode;
  reverse: boolean;
  unique: boolean;
  trim: boolean;
  ignoreEmpty: boolean;
  ignoreCase: boolean;
};

export type SortLinesResult = {
  output: string;
  lineCount: number;
};

export function sortLines(text: string, options: SortLinesOptions): SortLinesResult {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let lines = raw.map(line => (options.trim ? line.trim() : line));

  if (options.ignoreEmpty) {
    lines = lines.filter(line => line !== '');
  }

  if (options.unique) {
    const seen = new Set<string>();
    lines = lines.filter(line => {
      const key = options.ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const sensitivity = options.ignoreCase ? 'base' : 'variant';
  lines.sort((a, b) => {
    if (options.mode === 'length') {
      const diff = a.length - b.length;
      if (diff !== 0) return diff;
      return a.localeCompare(b, undefined, {sensitivity, numeric: true});
    }
    if (options.mode === 'numeric') {
      return a.localeCompare(b, undefined, {sensitivity, numeric: true});
    }
    return a.localeCompare(b, undefined, {sensitivity});
  });

  if (options.reverse) lines.reverse();

  return {output: lines.join('\n'), lineCount: lines.length};
}
