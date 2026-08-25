export type TextStats = {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  bytes: number;
  sentences: number;
};

export function countText(text: string): TextStats {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const chars = normalized.length;
  const charsNoSpaces = normalized.replace(/\s/g, '').length;
  const words = normalized.trim() === '' ? 0 : normalized.trim().split(/\s+/).length;
  const lines = normalized === '' ? 0 : normalized.split('\n').length;
  const bytes = new TextEncoder().encode(normalized).length;
  const sentences =
    normalized.trim() === ''
      ? 0
      : (normalized.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || []).filter(s => s.trim()).length;

  return {chars, charsNoSpaces, words, lines, bytes, sentences};
}
