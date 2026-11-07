// 验证文档清单的采集、内嵌与应用
import { describe, expect, it } from 'vitest';
import { PlaitBoard } from '@plait/core';
import {
  applyDocumentManifestToElements,
  collectDocumentManifest,
  collectDocumentManifestBase64,
  readDocumentManifestBase64,
} from './document-manifest';

const buildBoard = (children: any[]) =>
  ({
    children,
    viewport: { zoom: 1.5, origination: [20, 40] },
    theme: { themeColorMode: 'default' },
  }) as unknown as PlaitBoard;

const buildElements = () => [
  {
    id: 'root',
    type: 'mind',
    points: [[0, 0]],
    fill: '#ff000080',
    strokeColor: '#00ff00',
    isCollapsed: false,
    layout: 'right',
    data: { topic: { children: [{ text: 'Root' }] } },
    children: [
      {
        id: 'child',
        type: 'mind_child',
        isCollapsed: true,
        data: { topic: { children: [{ text: 'Child' }] } },
        children: [],
      },
    ],
  },
];

describe('document manifest', () => {
  it('collects node styles, collapsed state and viewport', () => {
    const manifest = collectDocumentManifest(buildBoard(buildElements()), 'board.mindforai');

    expect(manifest.type).toBe('mindforai-manifest');
    expect(manifest.document).toBe('board.mindforai');
    expect(manifest.viewport).toEqual({ zoom: 1.5, origination: [20, 40] });
    expect(manifest.theme).toBe('default');
    expect(manifest.language).toBe('zh');
    const rootState = manifest.nodes.find((node) => node.path === '0');
    const childState = manifest.nodes.find((node) => node.path === '0.0');
    expect(rootState?.fill).toBe('#ff000080');
    expect(rootState?.fillOpacity).toBe(50);
    expect(rootState?.strokeColor).toBe('#00ff00');
    expect(rootState?.isCollapsed).toBe(false);
    expect(rootState?.metadata?.layout).toBe('right');
    expect(childState?.isCollapsed).toBe(true);
  });

  it('applies collected styles to freshly loaded elements', () => {
    const manifest = collectDocumentManifest(buildBoard(buildElements()), 'board.mindforai');
    const loadedElements = [
      {
        id: 'new-root',
        type: 'mind',
        points: [[0, 0]],
        data: { topic: { children: [{ text: 'Root' }] } },
        children: [
          {
            id: 'new-child',
            type: 'mind_child',
            data: { topic: { children: [{ text: 'Child' }] } },
            children: [],
          },
        ],
      },
    ];

    applyDocumentManifestToElements(loadedElements as any, manifest);

    expect((loadedElements[0] as any).fill).toBe('#FF000080');
    expect((loadedElements[0] as any).strokeColor).toBe('#00FF00');
    expect((loadedElements[0] as any).isCollapsed).toBe(false);
    expect((loadedElements[0] as any).layout).toBe('right');
    expect((loadedElements[0].children[0] as any).isCollapsed).toBe(true);
  });

  it('round-trips the manifest through the embedded base64 field', () => {
    const board = buildBoard(buildElements());
    const manifest = collectDocumentManifest(board, 'folder/board.mindforai');

    const encoded = collectDocumentManifestBase64(board, 'folder/board.mindforai');
    expect(readDocumentManifestBase64(encoded)).toEqual(manifest);
    expect(readDocumentManifestBase64('')).toBeNull();
  });
});
