// 验证清单以 ZIP+Base64 内嵌到主文档并可无损还原
import { describe, expect, it } from 'vitest';
import {
  collectDocumentManifest,
  collectDocumentManifestBase64,
  readDocumentManifestBase64,
  type DocumentManifest,
} from './document-manifest';
import {
  decodeDocumentManifestFromBase64,
  encodeDocumentManifestToBase64,
} from './document-manifest-embed';

const createBoard = () =>
  ({
    children: [
      {
        id: 'root',
        type: 'mind',
        points: [[0, 0]],
        children: [],
        data: { topic: { children: [{ text: 'Root' }] } },
      },
    ],
    viewport: { zoom: 1.5, origination: [10, 20] },
  }) as any;

const buildManifest = (): DocumentManifest =>
  ({
    type: 'mindforai-manifest',
    version: 1,
    document: 'folder/board.mindforai',
    viewport: { zoom: 2, origination: [5, 6] },
    nodes: [
      {
        path: '0',
        fill: '#ff000080',
        fillOpacity: 50,
        strokeColor: '#00ff00',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        isCollapsed: true,
        metadata: { layout: 'right', manualWidth: 220 },
      },
    ],
  }) as unknown as DocumentManifest;

describe('document manifest embed', () => {
  it('round-trips a manifest through zip base64', () => {
    const manifest = buildManifest();
    const encoded = encodeDocumentManifestToBase64(manifest);

    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded).not.toContain('{');
    expect(decodeDocumentManifestFromBase64(encoded)).toEqual(manifest);
  });

  it('returns null for empty or corrupted base64', () => {
    expect(decodeDocumentManifestFromBase64('')).toBeNull();
    expect(decodeDocumentManifestFromBase64(null)).toBeNull();
    expect(decodeDocumentManifestFromBase64('not-a-zip')).toBeNull();
  });

  it('collects the board manifest and reads it back', () => {
    const board = createBoard();
    const encoded = collectDocumentManifestBase64(board, 'demo.mindforai');
    const decoded = readDocumentManifestBase64(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.document).toBe('demo.mindforai');
    expect(decoded?.viewport).toEqual({ zoom: 1.5, origination: [10, 20] });
    expect(decoded?.nodes.length).toBeGreaterThan(0);
    expect(decoded).toEqual(collectDocumentManifest(board, 'demo.mindforai'));
  });
});
