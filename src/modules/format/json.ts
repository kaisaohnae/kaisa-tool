export type JsonIndentStyle = '2' | '4' | 'tab';

export type JsonFormatOptions = {
  indent: JsonIndentStyle;
  sortKeys: boolean;
};

export type JsonCheckResult =
  | {ok: true; value: unknown; formatted: string}
  | {ok: false; error: string; line?: number; column?: number};

function indentChars(style: JsonIndentStyle): string {
  if (style === 'tab') return '\t';
  if (style === '4') return '    ';
  return '  ';
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([k, v]) => [k, sortValue(v)]));
  }
  return value;
}

/** Strip BOM, parse, optionally sort keys, then pretty-print. */
export function formatAndValidateJson(input: string, options: JsonFormatOptions = {indent: '2', sortKeys: false}): JsonCheckResult {
  const raw = input.replace(/^\uFEFF/, '').trim();
  if (!raw) {
    return {ok: false, error: 'Enter text.'};
  }

  try {
    let value = JSON.parse(raw) as unknown;
    if (options.sortKeys) value = sortValue(value);
    const formatted = JSON.stringify(value, null, indentChars(options.indent));
    return {ok: true, value, formatted};
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON.';
    const match = /position\s+(\d+)/i.exec(message) || /at position\s+(\d+)/i.exec(message);
    if (match) {
      const pos = Number(match[1]);
      const {line, column} = positionToLineColumn(raw, pos);
      return {ok: false, error: message, line, column};
    }
    return {ok: false, error: message};
  }
}

function positionToLineColumn(text: string, position: number): {line: number; column: number} {
  const safe = Math.max(0, Math.min(position, text.length));
  const before = text.slice(0, safe);
  const lines = before.split(/\r?\n/);
  return {line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1};
}

export function minifyJson(input: string, sortKeys = false): JsonCheckResult {
  const checked = formatAndValidateJson(input, {indent: '2', sortKeys});
  if (!checked.ok) return checked;
  return {ok: true, value: checked.value, formatted: JSON.stringify(checked.value)};
}
