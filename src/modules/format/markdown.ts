import {marked} from 'marked';

export type MarkdownOptions = {
  breaks?: boolean;
  gfm?: boolean;
};

export type MarkdownResult = {ok: true; html: string} | {ok: false; error: string};

export function stripScripts(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export function markdownToHtml(markdown: string, options: MarkdownOptions = {}): MarkdownResult {
  try {
    const html = marked.parse(markdown, {
      async: false,
      breaks: options.breaks ?? true,
      gfm: options.gfm ?? true
    }) as string;
    return {ok: true, html: stripScripts(html)};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'Conversion failed.'};
  }
}
