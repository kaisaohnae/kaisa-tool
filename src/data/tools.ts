export type ToolCategory = 'image' | 'pdf' | 'format' | 'edit';

export interface ToolItem {
  id: string;
  category: ToolCategory;
  title: string;
  description: string;
  href: string;
}

export const TOOL_CATEGORIES: {id: ToolCategory; label: string; description: string}[] = [
  {id: 'image', label: '이미지', description: '용량 줄이기, 리사이즈, 포맷 변환'},
  {id: 'pdf', label: 'PDF', description: '압축, 합치기, 분할, 이미지 변환'},
  {id: 'format', label: 'FORMAT', description: 'JSON·SQL 정렬·유효성 검사'},
  {id: 'edit', label: 'EDIT', description: '텍스트 비교·중복 제거'}
];

export const TOOLS: ToolItem[] = [
  {
    id: 'image-compress',
    category: 'image',
    title: '용량 줄이기',
    description: '품질을 조절해 이미지 파일 크기를 줄입니다.',
    href: '/image/compress/'
  },
  {
    id: 'image-resize',
    category: 'image',
    title: '사이즈 변경',
    description: '가로·세로 크기를 변경합니다.',
    href: '/image/resize/'
  },
  {
    id: 'jpg-to-png',
    category: 'image',
    title: 'JPG → PNG',
    description: 'JPG를 PNG로 변환합니다.',
    href: '/image/jpg-to-png/'
  },
  {
    id: 'png-to-jpg',
    category: 'image',
    title: 'PNG → JPG',
    description: 'PNG를 JPG로 변환합니다.',
    href: '/image/png-to-jpg/'
  },
  {
    id: 'webp-to-jpg',
    category: 'image',
    title: 'WebP → JPG',
    description: 'WebP를 JPG로 변환합니다.',
    href: '/image/webp-to-jpg/'
  },
  {
    id: 'pdf-compress',
    category: 'pdf',
    title: 'PDF 압축',
    description: '페이지를 다시 렌더링해 PDF 용량을 줄입니다.',
    href: '/pdf/compress/'
  },
  {
    id: 'pdf-merge',
    category: 'pdf',
    title: 'PDF 합치기',
    description: '여러 PDF를 하나로 합칩니다.',
    href: '/pdf/merge/'
  },
  {
    id: 'pdf-split',
    category: 'pdf',
    title: 'PDF 분할',
    description: '페이지 단위로 PDF를 나눕니다.',
    href: '/pdf/split/'
  },
  {
    id: 'jpg-to-pdf',
    category: 'pdf',
    title: 'JPG → PDF',
    description: 'JPG 이미지를 PDF로 만듭니다.',
    href: '/pdf/jpg-to-pdf/'
  },
  {
    id: 'pdf-to-jpg',
    category: 'pdf',
    title: 'PDF → JPG',
    description: 'PDF 페이지를 JPG로 추출합니다.',
    href: '/pdf/pdf-to-jpg/'
  },
  {
    id: 'format-json',
    category: 'format',
    title: 'JSON',
    description: 'JSON 문자열을 정렬하고 유효성을 검사합니다.',
    href: '/format/json/'
  },
  {
    id: 'format-sql',
    category: 'format',
    title: 'SQL',
    description: 'SQL 문을 정렬하고 패턴을 설정합니다.',
    href: '/format/sql/'
  },
  {
    id: 'edit-compare',
    category: 'edit',
    title: 'Compare',
    description: '두 텍스트의 줄 단위 차이를 비교합니다.',
    href: '/edit/compare/'
  },
  {
    id: 'edit-dedupe',
    category: 'edit',
    title: '중복제거',
    description: '중복된 줄을 제거합니다.',
    href: '/edit/dedupe/'
  }
];

export function getToolByHref(href: string): ToolItem | undefined {
  const normalized = href.endsWith('/') ? href : `${href}/`;
  return TOOLS.find(tool => tool.href === normalized);
}

export function getToolsByCategory(category: ToolCategory): ToolItem[] {
  return TOOLS.filter(tool => tool.category === category);
}

export function getCategory(category: ToolCategory) {
  return TOOL_CATEGORIES.find(item => item.id === category)!;
}
