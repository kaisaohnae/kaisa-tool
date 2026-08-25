export type ReplaceMode = 'literal' | 'regex';

export type ReplaceOptions = {
  mode: ReplaceMode;
  find: string;
  replace: string;
  flags: {
    g: boolean;
    i: boolean;
    m: boolean;
    s: boolean;
  };
};

export type ReplacePreview = {
  matchCount: number;
  error?: string;
};

export type ReplaceResult = {
  output: string;
  matchCount: number;
  error?: string;
};

function buildPattern(options: ReplaceOptions): {regex?: RegExp; literal?: string; error?: string} {
  if (!options.find) return {error: 'Enter a find string.'};

  if (options.mode === 'literal') {
    return {literal: options.find};
  }

  const flagStr =
    (options.flags.g ? 'g' : '') +
    (options.flags.i ? 'i' : '') +
    (options.flags.m ? 'm' : '') +
    (options.flags.s ? 's' : '');

  try {
    return {regex: new RegExp(options.find, flagStr || undefined)};
  } catch (err) {
    return {error: err instanceof Error ? err.message : 'Invalid regular expression.'};
  }
}

function countLiteral(text: string, find: string, ignoreCase: boolean): number {
  if (!find) return 0;
  if (!ignoreCase) {
    let count = 0;
    let from = 0;
    while (from <= text.length) {
      const idx = text.indexOf(find, from);
      if (idx === -1) break;
      count++;
      from = idx + Math.max(find.length, 1);
    }
    return count;
  }
  const lowerText = text.toLowerCase();
  const lowerFind = find.toLowerCase();
  let count = 0;
  let from = 0;
  while (from <= lowerText.length) {
    const idx = lowerText.indexOf(lowerFind, from);
    if (idx === -1) break;
    count++;
    from = idx + Math.max(lowerFind.length, 1);
  }
  return count;
}

function replaceLiteralAll(text: string, find: string, replacement: string, ignoreCase: boolean): string {
  if (!find) return text;
  if (!ignoreCase) return text.split(find).join(replacement);

  const lowerText = text.toLowerCase();
  const lowerFind = find.toLowerCase();
  let result = '';
  let from = 0;
  while (from <= text.length) {
    const idx = lowerText.indexOf(lowerFind, from);
    if (idx === -1) {
      result += text.slice(from);
      break;
    }
    result += text.slice(from, idx) + replacement;
    from = idx + Math.max(find.length, 1);
  }
  return result;
}

export function previewReplace(text: string, options: ReplaceOptions): ReplacePreview {
  const built = buildPattern(options);
  if (built.error) return {matchCount: 0, error: built.error};

  if (built.literal !== undefined) {
    return {matchCount: countLiteral(text, built.literal, options.flags.i)};
  }

  const regex = built.regex!;
  const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  const matches = text.match(global);
  return {matchCount: matches?.length ?? 0};
}

export function replaceAll(text: string, options: ReplaceOptions): ReplaceResult {
  const preview = previewReplace(text, options);
  if (preview.error) return {output: text, matchCount: 0, error: preview.error};

  const built = buildPattern(options);
  if (built.literal !== undefined) {
    return {
      output: replaceLiteralAll(text, built.literal, options.replace, options.flags.i),
      matchCount: preview.matchCount
    };
  }

  const regex = built.regex!;
  const withGlobal = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  return {output: text.replace(withGlobal, options.replace), matchCount: preview.matchCount};
}
