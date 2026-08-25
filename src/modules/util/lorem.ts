const LATIN_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
  'mollit', 'anim', 'id', 'est', 'laborum'
];

const KOREAN_SENTENCES = [
  '빠른 갈색 여우가 게으른 개를 뛰어넘습니다.',
  '오늘은 맑고 바람이 가볍게 붑니다.',
  '문서를 작성할 때 더미 텍스트가 도움이 됩니다.',
  '카이사 도구는 브라우저에서만 동작합니다.',
  '짧은 문장으로 레이아웃을 미리 확인할 수 있습니다.',
  '한글과 라틴 문자를 함께 섞어 쓸 수 있습니다.',
  '문단 길이를 조절하며 디자인을 점검하세요.',
  '샘플 문장은 실제 내용을 대신합니다.'
];

export type LoremMode = 'paragraphs' | 'sentences' | 'words';
export type LoremLang = 'latin' | 'korean' | 'mixed';

export type LoremOptions = {
  mode: LoremMode;
  count: number;
  lang: LoremLang;
};

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function latinSentence(seed: number, wordCount = 8 + (seed % 7)): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(pick(LATIN_WORDS, seed * 17 + i * 3));
  }
  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

function koreanSentence(seed: number): string {
  return pick(KOREAN_SENTENCES, seed);
}

function sentenceFor(seed: number, lang: LoremLang): string {
  if (lang === 'korean') return koreanSentence(seed);
  if (lang === 'latin') return latinSentence(seed);
  return seed % 2 === 0 ? latinSentence(seed) : koreanSentence(seed);
}

function paragraph(seed: number, lang: LoremLang): string {
  const n = 3 + (seed % 3);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(sentenceFor(seed + i * 11, lang));
  return parts.join(' ');
}

export function generateLorem(options: LoremOptions): string {
  const count = Math.min(50, Math.max(1, Math.floor(options.count) || 1));

  if (options.mode === 'words') {
    if (options.lang === 'korean') {
      const words = KOREAN_SENTENCES.join(' ').split(/\s+/);
      return Array.from({length: count}, (_, i) => pick(words, i)).join(' ');
    }
    return Array.from({length: count}, (_, i) => pick(LATIN_WORDS, i)).join(' ');
  }

  if (options.mode === 'sentences') {
    return Array.from({length: count}, (_, i) => sentenceFor(i + 1, options.lang)).join(' ');
  }

  return Array.from({length: count}, (_, i) => paragraph(i + 1, options.lang)).join('\n\n');
}
