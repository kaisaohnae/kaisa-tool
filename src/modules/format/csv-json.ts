import Papa from 'papaparse';

export type CsvJsonResult = {ok: true; result: string} | {ok: false; error: string};

export type CsvToJsonOptions = {
  header: boolean;
  delimiter: string;
  pretty?: boolean;
  indent?: number;
};

export type JsonToCsvOptions = {
  delimiter: string;
  header?: boolean;
};

export function csvToJson(csv: string, options: CsvToJsonOptions): CsvJsonResult {
  const raw = csv.replace(/^\uFEFF/, '');
  if (!raw.trim()) {
    return {ok: false, error: 'Enter text.'};
  }

  const parsed = Papa.parse<string[] | Record<string, string>>(raw, {
    header: options.header,
    delimiter: options.delimiter || undefined,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });

  if (parsed.errors.length) {
    const first = parsed.errors[0];
    const loc = first.row != null ? ` (row ${first.row + 1})` : '';
    return {ok: false, error: `${first.message}${loc}`};
  }

  const indent = options.pretty === false ? undefined : (options.indent ?? 2);
  try {
    return {ok: true, result: JSON.stringify(parsed.data, null, indent)};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'JSON conversion failed.'};
  }
}

export function jsonToCsv(json: string, options: JsonToCsvOptions): CsvJsonResult {
  const raw = json.replace(/^\uFEFF/, '').trim();
  if (!raw) {
    return {ok: false, error: 'Enter text.'};
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'Invalid JSON.'};
  }

  if (!Array.isArray(value)) {
    return {ok: false, error: 'JSON must be an array (of objects or arrays).'};
  }

  if (value.length === 0) {
    return {ok: true, result: ''};
  }

  const delimiter = options.delimiter || ',';
  const first = value[0];

  try {
    if (Array.isArray(first)) {
      const rows = value as unknown[][];
      const csv = Papa.unparse(rows, {delimiter, header: false});
      return {ok: true, result: csv};
    }

    if (first && typeof first === 'object') {
      const csv = Papa.unparse(value as Record<string, unknown>[], {
        delimiter,
        header: options.header !== false
      });
      return {ok: true, result: csv};
    }

    return {ok: false, error: 'Array items must be objects or arrays.'};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'CSV conversion failed.'};
  }
}
