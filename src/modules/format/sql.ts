import {format as formatSqlLib} from 'sql-formatter';

export type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'mariadb' | 'sqlite' | 'transactsql' | 'plsql';

export type SqlKeywordCase = 'upper' | 'lower' | 'preserve';

export type SqlFormatOptions = {
  dialect: SqlDialect;
  tabWidth: 2 | 4;
  useTabs: boolean;
  keywordCase: SqlKeywordCase;
  linesBetweenQueries: 0 | 1 | 2;
};

export type SqlFormatResult = {ok: true; formatted: string} | {ok: false; error: string};

export const DEFAULT_SQL_OPTIONS: SqlFormatOptions = {
  dialect: 'sql',
  tabWidth: 2,
  useTabs: false,
  keywordCase: 'upper',
  linesBetweenQueries: 1
};

export function formatSql(input: string, options: SqlFormatOptions = DEFAULT_SQL_OPTIONS): SqlFormatResult {
  const raw = input.replace(/^\uFEFF/, '').trim();
  if (!raw) return {ok: false, error: 'Enter text.'};

  try {
    const formatted = formatSqlLib(raw, {
      language: options.dialect,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      keywordCase: options.keywordCase,
      linesBetweenQueries: options.linesBetweenQueries
    });
    return {ok: true, formatted};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'SQL formatting failed.'};
  }
}

/** Light check: not empty and balanced quotes / parentheses. */
export function validateSqlLite(input: string): SqlFormatResult {
  const raw = input.replace(/^\uFEFF/, '').trim();
  if (!raw) return {ok: false, error: 'Enter text.'};

  let inSingle = false;
  let inDouble = false;
  let paren = 0;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const prev = raw[i - 1];

    if (ch === "'" && !inDouble && prev !== '\\') {
      // SQL escape '' inside string
      if (inSingle && raw[i + 1] === "'") {
        i++;
        continue;
      }
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
      continue;
    }
    if (inSingle || inDouble) continue;

    if (ch === '(') paren++;
    if (ch === ')') {
      paren--;
      if (paren < 0) return {ok: false, error: 'Unbalanced parentheses. Extra ).'};
    }
  }

  if (inSingle || inDouble) return {ok: false, error: 'Unclosed quotes.'};
  if (paren !== 0) return {ok: false, error: `Unbalanced parentheses. Remaining open: ${paren}`};

  return {ok: true, formatted: raw};
}

export function minifySql(input: string): SqlFormatResult {
  const checked = validateSqlLite(input);
  if (!checked.ok) return checked;

  // Keep string literals, collapse whitespace outside them.
  let out = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < checked.formatted.length; i++) {
    const ch = checked.formatted[i];
    if (ch === "'" && !inDouble) {
      if (inSingle && checked.formatted[i + 1] === "'") {
        out += "''";
        i++;
        continue;
      }
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      out += ch;
      continue;
    }
    if (inSingle || inDouble) {
      out += ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (out && !/\s$/.test(out)) out += ' ';
      continue;
    }
    out += ch;
  }

  return {ok: true, formatted: out.trim()};
}
