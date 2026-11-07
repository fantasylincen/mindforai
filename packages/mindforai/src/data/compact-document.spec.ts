import { PlaitBoard } from '@plait/core';
import {
  convertToCompactDocument,
  isCompactDocumentData,
  loadCompactDocument,
  serializeAsCompactDocument,
  compactDocumentToDocumentData,
} from './compact-document';
import { DocumentExportedType } from './types';
import { getFileNameWithoutExtension } from './json';

const mockBoard = (children: any[]) =>
  ({
    children,
    viewport: { zoom: 1 },
    theme: { themeColorMode: 'default' },
  }) as unknown as PlaitBoard;

const mindElements = [
  {
    id: 'root',
    type: 'mind',
    points: [
      [0, 0],
      [100, 40],
    ],
    data: {
      topic: {
        children: [{ text: '  Root \u200b' }],
      },
    },
    children: [
      {
        id: 'child-1',
        type: 'mind_child',
        data: { topic: { children: [{ text: 'Child A' }] } },
        children: [
          {
            id: 'grandchild-1',
            type: 'mind_child',
            data: { topic: { children: [{ text: 'Grandchild' }] } },
            children: [],
          },
        ],
      },
      {
        id: 'child-2',
        type: 'mind_child',
        data: { topic: { children: [{ text: 'Child\n\nB' }] } },
        children: [],
      },
    ],
  },
];

describe('drawnixlite', () => {
  it('trims mind elements into compact content', () => {
    const result = convertToCompactDocument({ elements: mindElements });
    expect(result).toEqual({
      type: DocumentExportedType.drawnixlite,
      version: 1,
      content: [
        {
          text: 'Root',
          children: [{ text: 'Child A', children: [{ text: 'Grandchild' }] }, { text: 'Child\nB' }],
        },
      ],
    });
    expect(isCompactDocumentData(result)).toBe(true);
  });

  it('prefers the editable topic text over cached mermaid data', () => {
    const result = convertToCompactDocument({
      elements: [
        {
          id: 'mermaid',
          type: 'mind_child',
          data: {
            topic: { children: [{ text: 'flowchart TD\n A --> B' }] },
            mermaidMind: { mermaid: 'flowchart LR\n A --> C', width: 100, height: 60 },
          },
          children: [],
        },
      ],
    });
    expect(result.content).toEqual([{ text: 'flowchart TD\nA --> B' }]);
  });

  it('serializes a board as drawnixlite json', () => {
    const serialized = JSON.parse(serializeAsCompactDocument(mockBoard(mindElements)));
    expect(serialized.type).toBe(DocumentExportedType.drawnixlite);
    expect(serialized.content[0].text).toBe('Root');
    expect(serialized.elements).toBeUndefined();
    expect(serialized.viewport).toBeUndefined();
  });

  it('restores drawnixlite data into valid board data', () => {
    const small = convertToCompactDocument({ elements: mindElements });
    const restored = compactDocumentToDocumentData(small);
    expect(restored.elements).toHaveLength(1);
    const root = restored.elements[0] as any;
    expect(root.type).toBe('mind');
    expect(root.layout).toBe('right');
    expect(root.points).toEqual([[0, 0]]);
    expect(root.data.topic.type).toBe('paragraph');
    expect(root.data.topic.children[0].text).toBe('Root');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].type).toBe('mind_child');
    expect(root.children[0].points).toBeUndefined();
    expect(root.children[0].layout).toBeUndefined();
    expect(root.children[0].data.topic.type).toBe('paragraph');
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].type).toBe('mind_child');
  });

  it('detects drawnixlite files on load', async () => {
    const small = convertToCompactDocument({ elements: mindElements });
    const restored = await loadCompactDocument(
      new Blob([JSON.stringify(small)], { type: 'application/json' })
    );
    expect(restored?.elements).toHaveLength(1);
    expect(await loadCompactDocument(new Blob(['{"type":"drawnix"}']))).toBeNull();
    expect(await loadCompactDocument(new Blob(['not json']))).toBeNull();
  });

  it('extracts file name without extension for save as', () => {
    expect(getFileNameWithoutExtension('todo03.mindforai')).toBe('todo03');
    expect(getFileNameWithoutExtension('B.drawnixlite')).toBe('B');
    expect(getFileNameWithoutExtension('noext')).toBe('noext');
    expect(getFileNameWithoutExtension('a.b.c')).toBe('a.b');
  });
});
