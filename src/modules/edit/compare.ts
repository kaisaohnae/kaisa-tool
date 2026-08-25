export type CompareOptions = {
  ignoreEmpty: boolean;
  trim: boolean;
  ignoreCase: boolean;
};

export type DiffKind = 'same' | 'added' | 'removed';

export type DiffRow = {
  kind: DiffKind;
  left?: string;
  right?: string;
  leftNo?: number;
  rightNo?: number;
};

export type CompareResult = {
  rows: DiffRow[];
  added: number;
  removed: number;
  same: number;
};

function normalizeLine(line: string, options: CompareOptions): string {
  let value = line;
  if (options.trim) value = value.trim();
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
}

function prepareLines(text: string, options: CompareOptions): {raw: string[]; keys: string[]} {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pairs = raw
    .map((line, index) => ({line, key: normalizeLine(line, options), index}))
    .filter(item => !(options.ignoreEmpty && item.key === ''));

  return {
    raw: pairs.map(p => p.line),
    keys: pairs.map(p => p.key)
  };
}

/** Line-based LCS diff for two texts. */
export function compareTexts(leftText: string, rightText: string, options: CompareOptions): CompareResult {
  const left = prepareLines(leftText, options);
  const right = prepareLines(rightText, options);
  const a = left.keys;
  const b = right.keys;
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({length: n + 1}, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let leftNo = 0;
  let rightNo = 0;
  let added = 0;
  let removed = 0;
  let same = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      leftNo++;
      rightNo++;
      rows.push({kind: 'same', left: left.raw[i], right: right.raw[j], leftNo, rightNo});
      same++;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      leftNo++;
      rows.push({kind: 'removed', left: left.raw[i], leftNo});
      removed++;
      i++;
    } else {
      rightNo++;
      rows.push({kind: 'added', right: right.raw[j], rightNo});
      added++;
      j++;
    }
  }

  while (i < n) {
    leftNo++;
    rows.push({kind: 'removed', left: left.raw[i], leftNo});
    removed++;
    i++;
  }
  while (j < m) {
    rightNo++;
    rows.push({kind: 'added', right: right.raw[j], rightNo});
    added++;
    j++;
  }

  return {rows, added, removed, same};
}
