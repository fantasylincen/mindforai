// UTIL-10 提供纯 TypeScript 的 MD5 摘要计算，用于状态栏展示节点文本指纹

const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = new Uint32Array(64);
for (let index = 0; index < 64; index++) {
  K[index] = Math.floor(Math.abs(Math.sin(index + 1)) * 4294967296);
}

const utf8Bytes = (input: string): number[] => {
  const bytes: number[] = [];
  for (let index = 0; index < input.length; index++) {
    let code = input.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < input.length) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        index++;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
};

const leftRotate = (value: number, shift: number) => {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
};

const toHexLittleEndian = (value: number) => {
  let hex = '';
  for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
    hex += ((value >>> (byteIndex * 8)) & 0xff).toString(16).padStart(2, '0');
  }
  return hex;
};

export const computeMd5 = (input: string): string => {
  const bytes = utf8Bytes(input);
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }
  const bitLengthLow = bitLength >>> 0;
  const bitLengthHigh = Math.floor(bitLength / 4294967296) >>> 0;
  for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
    bytes.push((bitLengthLow >>> (byteIndex * 8)) & 0xff);
  }
  for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
    bytes.push((bitLengthHigh >>> (byteIndex * 8)) & 0xff);
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkOffset = 0; chunkOffset < bytes.length; chunkOffset += 64) {
    const words = new Uint32Array(16);
    for (let wordIndex = 0; wordIndex < 16; wordIndex++) {
      const base = chunkOffset + wordIndex * 4;
      words[wordIndex] =
        bytes[base] | (bytes[base + 1] << 8) | (bytes[base + 2] << 16) | (bytes[base + 3] << 24);
    }
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let step = 0; step < 64; step++) {
      let f: number;
      let g: number;
      if (step < 16) {
        f = (b & c) | (~b & d);
        g = step;
      } else if (step < 32) {
        f = (d & b) | (~d & c);
        g = (5 * step + 1) % 16;
      } else if (step < 48) {
        f = b ^ c ^ d;
        g = (3 * step + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * step) % 16;
      }
      const sum = (a + (f >>> 0) + K[step] + words[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + leftRotate(sum, SHIFT_AMOUNTS[step])) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return (
    toHexLittleEndian(a0) + toHexLittleEndian(b0) + toHexLittleEndian(c0) + toHexLittleEndian(d0)
  );
};
