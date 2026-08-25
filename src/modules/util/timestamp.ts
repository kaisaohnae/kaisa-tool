export type TimestampParts = {
  ms: number;
  seconds: number;
  iso: string;
  local: string;
  utc: string;
};

export function nowParts(): TimestampParts {
  return fromMs(Date.now());
}

export function fromMs(ms: number): TimestampParts {
  const date = new Date(ms);
  return {
    ms,
    seconds: Math.floor(ms / 1000),
    iso: date.toISOString(),
    local: date.toLocaleString(undefined, {timeZoneName: 'short'}),
    utc: date.toUTCString()
  };
}

export function parseTimestampInput(input: string): {ok: true; parts: TimestampParts} | {ok: false; error: string} {
  const trimmed = input.trim();
  if (!trimmed) return {ok: false, error: 'Enter a value.'};

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return {ok: false, error: 'Invalid number.'};
    const ms = Math.abs(num) < 1e12 ? Math.round(num * 1000) : Math.round(num);
    return {ok: true, parts: fromMs(ms)};
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return {ok: false, error: 'Could not parse date.'};
  return {ok: true, parts: fromMs(parsed)};
}
