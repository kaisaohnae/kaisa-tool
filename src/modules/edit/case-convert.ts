export type CaseStyle =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant';

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .replace(/([가-힣])([A-Za-z0-9])/g, '$1 $2')
    .replace(/([A-Za-z0-9])([가-힣])/g, '$1 $2')
    .split(/[^A-Za-z0-9가-힣]+/)
    .filter(Boolean);
}

function toTitleWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function convertCase(text: string, style: CaseStyle): string {
  if (!text) return '';

  switch (style) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\S+/g, word => toTitleWord(word));
    case 'sentence': {
      const lower = text.toLowerCase();
      return lower.replace(/(^\s*[a-z가-힣])|([.!?]\s+[a-z가-힣])/g, m => m.toUpperCase());
    }
    case 'camel':
    case 'pascal':
    case 'snake':
    case 'kebab':
    case 'constant': {
      const words = splitWords(text);
      if (words.length === 0) return '';
      if (style === 'snake') return words.map(w => w.toLowerCase()).join('_');
      if (style === 'kebab') return words.map(w => w.toLowerCase()).join('-');
      if (style === 'constant') return words.map(w => w.toUpperCase()).join('_');
      const titled = words.map(w => toTitleWord(w));
      if (style === 'pascal') return titled.join('');
      return titled[0].toLowerCase() + titled.slice(1).join('');
    }
    default:
      return text;
  }
}
