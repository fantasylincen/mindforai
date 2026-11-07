// 验证清单以 .mindforai 文本格式序列化并可无损解析回来
import { describe, expect, it } from 'vitest';
import { serializeDocumentManifestText, parseDocumentManifestText } from './document-manifest-text';
import type { DocumentManifest } from './document-manifest';

const buildManifest = () =>
  ({
    type: 'mindforai-manifest',
    version: 1,
    document: 'folder/board.mindforai',
    theme: 'dark',
    language: 'en',
    viewport: { zoom: 1.5, origination: [20, 40] },
    nodes: [
      {
        path: '0',
        fill: '#ff000080',
        fillOpacity: 50,
        strokeColor: '#00ff00',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        isCollapsed: false,
        metadata: { layout: 'right', manualWidth: 220, branchColor: '#123456' },
      },
      {
        path: '0.0',
        isCollapsed: true,
        metadata: { start: [1, 2], end: [3, 4] },
      },
    ],
  }) as unknown as DocumentManifest;

describe('document manifest text format', () => {
  it('writes the manifest as a mindforai text tree', () => {
    const text = serializeDocumentManifestText(buildManifest());

    expect(text.startsWith('type: mindforai\nversion: 1\ncontent[1]:')).toBe(true);
    expect(text).toContain('- text: manifest');
    expect(text).toContain('- document: folder/board.mindforai');
    expect(text).toContain('- theme: dark');
    expect(text).toContain('- language: en');
    expect(text).toContain('- zoom: 1.5');
    expect(text).toContain('- origination: [20,40]');
    expect(text).toContain('- text: node 0.0');
    expect(text).not.toContain('{');
  });

  it('parses the text back into an equivalent manifest', () => {
    const manifest = buildManifest();

    expect(parseDocumentManifestText(serializeDocumentManifestText(manifest))).toEqual(manifest);
  });

  it('ignores contents that are not a manifest text document', () => {
    expect(parseDocumentManifestText('{"type":"mindforai-manifest","nodes":[]}')).toBeNull();
    expect(parseDocumentManifestText('type: mindforai\nversion: 1\ncontent[0]:')).toBeNull();
    expect(
      parseDocumentManifestText(
        'type: mindforai\nversion: 1\ncontent[1]:\n  - text: 普通文档\n'
      )
    ).toBeNull();
  });
});
