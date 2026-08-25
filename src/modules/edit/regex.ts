export type RegexFlags = {
  g: boolean;
  i: boolean;
  m: boolean;
  s: boolean;
};

export type RegexMatchInfo = {
  index: number;
  match: string;
  groups: string[];
  named?: Record<string, string>;
};

export type RegexTestResult = {
  ok: boolean;
  error?: string;
  matchCount: number;
  matches: RegexMatchInfo[];
  replacePreview: string;
};

export function testRegex(
  pattern: string,
  flags: RegexFlags,
  text: string,
  replaceWith = ''
): RegexTestResult {
  if (!pattern) {
    return {ok: false, error: 'Enter a pattern.', matchCount: 0, matches: [], replacePreview: text};
  }

  const flagStr =
    (flags.g ? 'g' : '') + (flags.i ? 'i' : '') + (flags.m ? 'm' : '') + (flags.s ? 's' : '');

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flagStr || undefined);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid regular expression.',
      matchCount: 0,
      matches: [],
      replacePreview: text
    };
  }

  const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  const matches: RegexMatchInfo[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;

  while ((m = global.exec(text)) !== null) {
    const groups = m.slice(1).map(g => g ?? '');
    const named =
      m.groups && Object.keys(m.groups).length > 0
        ? Object.fromEntries(Object.entries(m.groups).map(([k, v]) => [k, v ?? '']))
        : undefined;
    matches.push({index: m.index, match: m[0], groups, named});
    if (m[0].length === 0) {
      global.lastIndex++;
    }
    guard++;
    if (guard > 10000) break;
  }

  let replacePreview = text;
  try {
    replacePreview = text.replace(global, replaceWith);
  } catch {
    replacePreview = text;
  }

  return {
    ok: true,
    matchCount: matches.length,
    matches,
    replacePreview
  };
}
