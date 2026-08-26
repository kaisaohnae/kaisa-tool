/**
 * Rewrites tool page metadata to use toolPageMetadata(href) from @/lib/seo.
 * Run: node scripts/patch-tool-seo-metadata.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const toolsRoot = path.resolve('src/app/(tools)');
const categoryDirs = new Set(['image', 'pdf', 'format', 'edit', 'util']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'page.tsx') out.push(full);
  }
  return out;
}

const pages = walk(toolsRoot);
let updated = 0;

for (const file of pages) {
  const rel = path.relative(toolsRoot, file).replace(/\\/g, '/');
  const parts = rel.split('/');
  // category/page.tsx → hub (skip)
  if (parts.length === 2 && categoryDirs.has(parts[0])) continue;
  // category/slug/page.tsx
  if (parts.length !== 3 || parts[2] !== 'page.tsx') continue;

  const href = `/${parts[0]}/${parts[1]}/`;
  let source = fs.readFileSync(file, 'utf8');

  if (source.includes('toolPageMetadata(')) {
    // already patched — still normalize href if needed
    continue;
  }

  // Remove Metadata type import if only used for metadata
  source = source.replace(/import type \{Metadata\} from 'next';\r?\n/, '');

  if (!source.includes("from '@/lib/seo'")) {
    // Insert import after first import block line
    const firstImportEnd = source.indexOf('\n');
    // Put seo import near top after existing imports
    const lines = source.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImport = i;
    }
    lines.splice(lastImport + 1, 0, "import {toolPageMetadata} from '@/lib/seo';");
    source = lines.join('\n');
  }

  source = source.replace(
    /export const metadata(?:: Metadata)?\s*=\s*\{[\s\S]*?\};/,
    `export const metadata = toolPageMetadata('${href}');`
  );

  if (!source.includes('toolPageMetadata(')) {
    console.warn('skip (no metadata matched):', rel);
    continue;
  }

  fs.writeFileSync(file, source, 'utf8');
  updated += 1;
  console.log('updated', href);
}

console.log(`done: ${updated} pages`);
