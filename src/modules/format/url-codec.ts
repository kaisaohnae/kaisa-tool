export type UrlCodecMode = 'component' | 'full';

export type UrlCodecResult = {ok: true; result: string} | {ok: false; error: string};

export function encodeUrl(text: string, mode: UrlCodecMode = 'component'): UrlCodecResult {
  if (!text) {
    return {ok: false, error: 'Enter text.'};
  }
  try {
    if (mode === 'full') {
      return {ok: true, result: encodeURI(text)};
    }
    return {ok: true, result: encodeURIComponent(text)};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'Encoding failed.'};
  }
}

export function decodeUrl(text: string, mode: UrlCodecMode = 'component'): UrlCodecResult {
  if (!text) {
    return {ok: false, error: 'Enter text.'};
  }
  try {
    if (mode === 'full') {
      return {ok: true, result: decodeURI(text)};
    }
    return {ok: true, result: decodeURIComponent(text)};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'Decoding failed. (Invalid % escape?)'};
  }
}
