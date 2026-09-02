export type ToolCategory = 'image' | 'pdf' | 'format' | 'edit' | 'util';

export interface ToolItem {
  id: string;
  category: ToolCategory;
  title: string;
  description: string;
  href: string;
}

export const TOOL_CATEGORIES: {id: ToolCategory; label: string; description: string}[] = [
  {id: 'image', label: 'Image', description: 'Resize, compress, convert, and edit images'},
  {id: 'pdf', label: 'PDF', description: 'Compress, merge, split, and edit pages'},
  {id: 'format', label: 'FORMAT', description: 'JSON, SQL, QR, encoding, and conversions'},
  {id: 'edit', label: 'EDIT', description: 'Compare, sort, regex, and text tools'},
  {id: 'util', label: 'UTIL', description: 'Password, UUID, units, and helpers'}
];

export const TOOLS: ToolItem[] = [
  // image
  {
    id: 'image-compress',
    category: 'image',
    title: 'Compress',
    description: 'Reduce image file size by adjusting quality.',
    href: '/image/compress/'
  },
  {
    id: 'image-resize',
    category: 'image',
    title: 'Resize',
    description: 'Change width and height.',
    href: '/image/resize/'
  },
  {
    id: 'image-crop',
    category: 'image',
    title: 'Crop',
    description: 'Crop to a selected region.',
    href: '/image/crop/'
  },
  {
    id: 'image-stroke',
    category: 'image',
    title: 'Stroke',
    description: 'Draw rectangular outlines on the image.',
    href: '/image/stroke/'
  },
  {
    id: 'image-rotate',
    category: 'image',
    title: 'Rotate & Flip',
    description: 'Rotate and flip horizontally or vertically.',
    href: '/image/rotate/'
  },
  {
    id: 'image-watermark',
    category: 'image',
    title: 'Watermark',
    description: 'Add a text or image watermark.',
    href: '/image/watermark/'
  },
  {
    id: 'image-background',
    category: 'image',
    title: 'Background',
    description: 'Fill or remove the background.',
    href: '/image/background/'
  },
  {
    id: 'image-favicon',
    category: 'image',
    title: 'Favicon',
    description: 'Generate favicon PNGs in multiple sizes.',
    href: '/image/favicon/'
  },
  {
    id: 'jpg-to-png',
    category: 'image',
    title: 'JPG → PNG',
    description: 'Convert JPG to PNG.',
    href: '/image/jpg-to-png/'
  },
  {
    id: 'png-to-jpg',
    category: 'image',
    title: 'PNG → JPG',
    description: 'Convert PNG to JPG.',
    href: '/image/png-to-jpg/'
  },
  {
    id: 'webp-to-jpg',
    category: 'image',
    title: 'WebP → JPG',
    description: 'Convert WebP to JPG.',
    href: '/image/webp-to-jpg/'
  },
  // pdf
  {
    id: 'pdf-compress',
    category: 'pdf',
    title: 'Compress PDF',
    description: 'Re-render pages to reduce PDF size.',
    href: '/pdf/compress/'
  },
  {
    id: 'pdf-merge',
    category: 'pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one.',
    href: '/pdf/merge/'
  },
  {
    id: 'pdf-split',
    category: 'pdf',
    title: 'Split PDF',
    description: 'Split a PDF by pages.',
    href: '/pdf/split/'
  },
  {
    id: 'pdf-rotate',
    category: 'pdf',
    title: 'Rotate Pages',
    description: 'Rotate PDF pages.',
    href: '/pdf/rotate/'
  },
  {
    id: 'pdf-pages',
    category: 'pdf',
    title: 'Edit Pages',
    description: 'Reorder or delete pages.',
    href: '/pdf/pages/'
  },
  {
    id: 'pdf-stamp',
    category: 'pdf',
    title: 'Stamp Image',
    description: 'Stamp an image onto a PDF.',
    href: '/pdf/stamp/'
  },
  {
    id: 'pdf-metadata',
    category: 'pdf',
    title: 'Metadata',
    description: 'View and edit title, author, and other metadata.',
    href: '/pdf/metadata/'
  },
  {
    id: 'jpg-to-pdf',
    category: 'pdf',
    title: 'JPG → PDF',
    description: 'Create a PDF from JPG images.',
    href: '/pdf/jpg-to-pdf/'
  },
  {
    id: 'pdf-to-jpg',
    category: 'pdf',
    title: 'PDF → JPG',
    description: 'Extract PDF pages as JPG images.',
    href: '/pdf/pdf-to-jpg/'
  },
  // format
  {
    id: 'format-json',
    category: 'format',
    title: 'JSON',
    description: 'Format and validate JSON strings.',
    href: '/format/json/'
  },
  {
    id: 'format-sql',
    category: 'format',
    title: 'SQL',
    description: 'Format SQL and configure style options.',
    href: '/format/sql/'
  },
  {
    id: 'format-qr',
    category: 'format',
    title: 'QR Code',
    description: 'Generate a QR code from a URL or text.',
    href: '/format/qr/'
  },
  {
    id: 'format-base64',
    category: 'format',
    title: 'Base64',
    description: 'Encode and decode text as Base64.',
    href: '/format/base64/'
  },
  {
    id: 'format-url',
    category: 'format',
    title: 'URL',
    description: 'Encode and decode URLs.',
    href: '/format/url/'
  },
  {
    id: 'format-hash',
    category: 'format',
    title: 'Hash',
    description: 'Compute MD5 and SHA hashes.',
    href: '/format/hash/'
  },
  {
    id: 'format-csv-json',
    category: 'format',
    title: 'CSV ↔ JSON',
    description: 'Convert between CSV and JSON.',
    href: '/format/csv-json/'
  },
  {
    id: 'format-markdown',
    category: 'format',
    title: 'Markdown',
    description: 'Preview Markdown as HTML.',
    href: '/format/markdown/'
  },
  {
    id: 'format-color',
    category: 'format',
    title: 'Color',
    description: 'Convert between HEX, RGB, and HSL.',
    href: '/format/color/'
  },
  {
    id: 'format-jwt',
    category: 'format',
    title: 'JWT',
    description: 'Decode JWT header and payload.',
    href: '/format/jwt/'
  },
  // edit
  {
    id: 'edit-compare',
    category: 'edit',
    title: 'Compare',
    description: 'Compare two texts line by line.',
    href: '/edit/compare/'
  },
  {
    id: 'edit-dedupe',
    category: 'edit',
    title: 'Deduplicate',
    description: 'Remove duplicate lines.',
    href: '/edit/dedupe/'
  },
  {
    id: 'edit-sort',
    category: 'edit',
    title: 'Sort Lines',
    description: 'Sort and clean up lines.',
    href: '/edit/sort/'
  },
  {
    id: 'edit-case',
    category: 'edit',
    title: 'Case Convert',
    description: 'Change letter case and case styles.',
    href: '/edit/case/'
  },
  {
    id: 'edit-replace',
    category: 'edit',
    title: 'Find & Replace',
    description: 'Find and replace with text or regex.',
    href: '/edit/replace/'
  },
  {
    id: 'edit-count',
    category: 'edit',
    title: 'Word Count',
    description: 'Count characters, words, lines, and bytes.',
    href: '/edit/count/'
  },
  {
    id: 'edit-slug',
    category: 'edit',
    title: 'Slug',
    description: 'Generate a URL-friendly slug.',
    href: '/edit/slug/'
  },
  {
    id: 'edit-regex',
    category: 'edit',
    title: 'Regex',
    description: 'Test regular expressions and inspect matches.',
    href: '/edit/regex/'
  },
  // util
  {
    id: 'util-password',
    category: 'util',
    title: 'Password',
    description: 'Generate a secure password.',
    href: '/util/password/'
  },
  {
    id: 'util-uuid',
    category: 'util',
    title: 'UUID',
    description: 'Generate UUIDs.',
    href: '/util/uuid/'
  },
  {
    id: 'util-timestamp',
    category: 'util',
    title: 'Timestamp',
    description: 'Convert between Unix time and dates.',
    href: '/util/timestamp/'
  },
  {
    id: 'util-unit',
    category: 'util',
    title: 'Unit Converter',
    description: 'Convert length, size, temperature, and px/rem.',
    href: '/util/unit/'
  },
  {
    id: 'util-lorem',
    category: 'util',
    title: 'Lorem Ipsum',
    description: 'Generate placeholder text for layouts and mockups.',
    href: '/util/lorem/'
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
