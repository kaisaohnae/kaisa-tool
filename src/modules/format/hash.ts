export type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const WEB_ALGOS: Record<Exclude<HashAlgo, 'MD5'>, string> = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512'
};

function toHex(bytes: ArrayBuffer | Uint8Array, uppercase = false): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const hex = Array.from(view, b => b.toString(16).padStart(2, '0')).join('');
  return uppercase ? hex.toUpperCase() : hex;
}

function md5(bytes: Uint8Array): Uint8Array {
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  const bitLen = bytes.length * 8;
  const withPad = ((bytes.length + 8) >>> 6) + 1;
  const total = withPad * 64;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(total - 8, bitLen >>> 0, true);
  view.setUint32(total - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));

  for (let offset = 0; offset < total; offset += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(offset + i * 4, true);

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl(F, S[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return out;
}

export async function hashBytes(data: ArrayBuffer | Uint8Array, algo: HashAlgo, uppercase = false): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (algo === 'MD5') {
    return toHex(md5(bytes), uppercase);
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest(WEB_ALGOS[algo], copy);
  return toHex(digest, uppercase);
}

export async function hashText(text: string, algo: HashAlgo, uppercase = false): Promise<string> {
  return hashBytes(new TextEncoder().encode(text), algo, uppercase);
}

export async function hashFile(file: File, algo: HashAlgo, uppercase = false): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashBytes(buffer, algo, uppercase);
}

export function hashesMatch(a: string, b: string): boolean {
  return a.replace(/\s+/g, '').toLowerCase() === b.replace(/\s+/g, '').toLowerCase();
}
