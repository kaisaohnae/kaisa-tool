export type JwtDecodeResult =
  | {
      ok: true;
      header: string;
      payload: string;
      signature: string;
      headerObj: Record<string, unknown>;
      payloadObj: Record<string, unknown>;
      alg?: string;
      exp?: string;
      iat?: string;
      nbf?: string;
      unsigned: boolean;
      warnings: string[];
    }
  | {ok: false; error: string};

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodePart(part: string): unknown {
  const json = new TextDecoder().decode(base64UrlToBytes(part));
  return JSON.parse(json);
}

function formatUnix(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.toLocaleString()} (unix ${value})`;
}

export function decodeJwt(token: string): JwtDecodeResult {
  const raw = token.trim();
  if (!raw) {
    return {ok: false, error: 'Enter a JWT.'};
  }

  const parts = raw.split('.');
  if (parts.length < 2 || parts.length > 3) {
    return {ok: false, error: 'JWT must be header.payload[.signature].'};
  }

  const [headerPart, payloadPart, signaturePart = ''] = parts;
  const warnings: string[] = [];

  try {
    const headerObj = decodePart(headerPart) as Record<string, unknown>;
    const payloadObj = decodePart(payloadPart) as Record<string, unknown>;

    if (typeof headerObj !== 'object' || headerObj === null || Array.isArray(headerObj)) {
      return {ok: false, error: 'Header is not an object.'};
    }
    if (typeof payloadObj !== 'object' || payloadObj === null || Array.isArray(payloadObj)) {
      return {ok: false, error: 'Payload is not an object.'};
    }

    const alg = typeof headerObj.alg === 'string' ? headerObj.alg : undefined;
    const unsigned = !signaturePart || alg === 'none' || alg === 'None';
    if (unsigned) warnings.push('No signature or alg=none — token is not verified.');
    else warnings.push('Signature is decoded only; it is not verified.');

    if (typeof payloadObj.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payloadObj.exp < now) warnings.push('Token is expired (exp).');
    }

    return {
      ok: true,
      header: JSON.stringify(headerObj, null, 2),
      payload: JSON.stringify(payloadObj, null, 2),
      signature: signaturePart || '(none)',
      headerObj,
      payloadObj,
      alg,
      exp: formatUnix(payloadObj.exp),
      iat: formatUnix(payloadObj.iat),
      nbf: formatUnix(payloadObj.nbf),
      unsigned,
      warnings
    };
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'JWT decoding failed.'};
  }
}
