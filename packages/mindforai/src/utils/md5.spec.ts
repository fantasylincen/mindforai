import { describe, expect, it } from 'vitest';
import { computeMd5 } from './md5';

describe('computeMd5', () => {
  it('matches known MD5 digests', () => {
    expect(computeMd5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(computeMd5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(computeMd5('hello world')).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
    expect(computeMd5('The quick brown fox jumps over the lazy dog')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6'
    );
  });

  it('handles non-ASCII text via UTF-8 encoding', () => {
    expect(computeMd5('中文测试')).toBe('089b4943ea034acfa445d050c7913e55');
  });
});
