export type Base64Result = {ok: true; result: string} | {ok: false; error: string};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64(text: string): Base64Result {
  try {
    const bytes = new TextEncoder().encode(text);
    return {ok: true, result: bytesToBase64(bytes)};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'Encoding failed.'};
  }
}

export function decodeBase64(text: string): Base64Result {
  const raw = text.replace(/\s+/g, '');
  if (!raw) {
    return {ok: false, error: 'Enter text.'};
  }
  try {
    const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(padded)) {
      return {ok: false, error: 'Invalid Base64 string.'};
    }
    const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = base64ToBytes(normalized);
    return {ok: true, result: new TextDecoder().decode(bytes)};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'Decoding failed.'};
  }
}

export async function fileToBase64DataUrl(file: File): Promise<Base64Result> {
  try {
    const buffer = await file.arrayBuffer();
    const b64 = bytesToBase64(new Uint8Array(buffer));
    const mime = file.type || 'application/octet-stream';
    return {ok: true, result: `data:${mime};base64,${b64}`};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'File conversion failed.'};
  }
}
