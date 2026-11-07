import { PlaitBoard } from '@plait/core';
import {
  convertToMindForAI,
  isMindForAIData,
  isMindForAIFile,
  loadMindForAI,
  mindForAIToDocumentData,
  serializeAsMindForAI,
} from './toon-document';
import { loadFromJSONFile, resolveDocumentFormat } from './json';
import { DocumentExportedType } from './types';

const mockBoard = (children: any[]) =>
  ({
    children,
    viewport: { zoom: 1.5, origination: { x: -20, y: 30 } },
    theme: { themeColorMode: 'default' },
  }) as unknown as PlaitBoard;

const buildTopic = (text: string) => ({ type: 'paragraph', children: [{ text }] });

const elements = [
  {
    id: 'root',
    type: 'mind',
    points: [
      [0, 0],
      [100, 40],
    ],
    data: { topic: buildTopic('TODOS') },
    children: [
      {
        id: 'child-1',
        type: 'mind_child',
        data: { topic: buildTopic('1.优先读取项目核心文档 ./docs/project.drawnixlite') },
        children: [],
      },
      {
        id: 'child-2',
        type: 'mind_child',
        data: { topic: buildTopic('规则') },
        children: [
          {
            id: 'grandchild-1',
            type: 'mind_child',
            data: { topic: buildTopic('最终给用户的报告需要使用中文,其余场景不做严格要求') },
            children: [],
          },
        ],
      },
    ],
  },
];

const buildMicroBlob = () =>
  new Blob([serializeAsMindForAI(mockBoard(elements))], {
    type: 'application/vnd.mindforai+toon',
  });

describe('mindforai text document', () => {
  it('compresses mind elements into a plain text tree', () => {
    const result = convertToMindForAI({ elements });

    expect(result).toEqual({
      type: DocumentExportedType.mindforai,
      version: 1,
      content: [
        {
          text: 'TODOS',
          children: [
            '1.优先读取项目核心文档 ./docs/project.drawnixlite',
            { text: '规则', children: ['最终给用户的报告需要使用中文,其余场景不做严格要求'] },
          ],
        },
      ],
    });
    expect(isMindForAIData(result)).toBe(true);
  });

  it('serializes a board as compact text document without quoted nodes', () => {
    const serialized = serializeAsMindForAI(mockBoard(elements));

    expect(serialized).toContain('type: mindforai');
    expect(serialized).toContain('version: 1');
    expect(serialized).not.toContain('mind_child');
    expect(serialized).not.toContain('paragraph');
    expect(serialized).not.toContain('id');
    expect(serialized).not.toContain('points');
    expect(serialized).not.toContain('"');
    expect(serialized.length).toBeLessThan(JSON.stringify({ type: 'drawnixlite', elements }).length);

    expect(serialized).toContain('      - 1.优先读取项目核心文档 ./docs/project.drawnixlite');
    expect(serialized).toContain('          - 最终给用户的报告需要使用中文,其余场景不做严格要求');
  });

  it('parses the readable text format and inline toon documents', async () => {
    const readable = await loadMindForAI(buildMicroBlob());
    expect(readable?.elements).toHaveLength(1);

    const inlineToon = [
      'type: mindforai',
      'version: 1',
      'content[1]:',
      '  - text: TODOS',
      '    children[2]: "AAAAAAAAA",BBBBBBBBBBB',
    ].join('\n');
    const restored = await loadMindForAI(new Blob([inlineToon]));
    const root = restored?.elements[0] as any;
    expect(root.children).toHaveLength(2);
    expect(root.children[0].data.topic.children[0].text).toBe('AAAAAAAAA');
    expect(root.children[1].data.topic.children[0].text).toBe('BBBBBBBBBBB');
  });

  it('restores compact content into valid mind elements', async () => {
    const restored = await loadMindForAI(buildMicroBlob());

    expect(restored).not.toBeNull();
    expect(restored?.elements).toHaveLength(1);
    const root = restored?.elements[0] as any;
    expect(root.type).toBe('mind');
    expect(root.data.topic.children[0].text).toBe('TODOS');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].data.topic.children[0].text).toBe(
      '1.优先读取项目核心文档 ./docs/project.drawnixlite'
    );
    expect(root.children[1].children[0].data.topic.children[0].text).toBe(
      '最终给用户的报告需要使用中文,其余场景不做严格要求'
    );
  });

  it('keeps multi root trees and special characters', async () => {
    const roots = [
      {
        id: 'a',
        type: 'mind',
        data: { topic: buildTopic('root, with: symbols "x"') },
        children: [],
      },
      { id: 'b', type: 'mind', data: { topic: buildTopic('多行\n文本') }, children: [] },
    ];

    const restored = await loadMindForAI(
      new Blob([serializeAsMindForAI(mockBoard(roots))], {
        type: 'application/vnd.mindforai+toon',
      })
    );

    const restoredElements = (restored?.elements || []) as any[];
    expect(restoredElements).toHaveLength(2);
    expect(restoredElements[0].data.topic.children[0].text).toBe('root, with: symbols "x"');
    expect(restoredElements[1].data.topic.children[0].text).toBe('多行\n文本');
  });

  it('ignores documents without mindforai structure', async () => {
    expect(await loadMindForAI(new Blob(['{"type":"drawnixlite","content":[]}']))).toBeNull();
    expect(await loadMindForAI(new Blob(['content[1]: a']))).toBeNull();
    expect(isMindForAIData({ type: 'mindforai' })).toBe(false);
    expect(isMindForAIData(null)).toBe(false);
  });

  it('accepts plain text nodes and skips empty ones', () => {
    const restored = mindForAIToDocumentData({
      type: DocumentExportedType.mindforai,
      version: 1,
      content: ['single root', '', { text: '', children: [] }],
    });

    expect(restored.elements).toHaveLength(1);
    expect((restored.elements[0] as any).data.topic.children[0].text).toBe('single root');
  });

  it('recognizes mindforai files by name or mime type', () => {
    expect(isMindForAIFile(new File([''], 'board.mindforai'))).toBe(true);
    expect(
      isMindForAIFile(new File([''], 'board', { type: 'application/vnd.mindforai+toon' }))
    ).toBe(true);
    expect(isMindForAIFile(new File([''], 'board.drawnix'))).toBe(false);
    expect(isMindForAIFile(new File([''], 'board.drawnixlite'))).toBe(false);
    expect(resolveDocumentFormat('board.mindforai')).toBe('mindforai');
    expect(resolveDocumentFormat('board.drawnixlite')).toBe('drawnixlite');
    expect(resolveDocumentFormat('board.smalldrawnix')).toBe('mindforai');
    expect(resolveDocumentFormat('board.drawnix')).toBe('mindforai');
    expect(resolveDocumentFormat(null)).toBe('mindforai');
  });

  it('opens mindforai files through the shared document loader', async () => {
    const file = new File([serializeAsMindForAI(mockBoard(elements))], 'board.mindforai', {
      type: 'application/vnd.mindforai+toon',
    });

    const opened = await loadFromJSONFile(file);

    const openedElements = (opened?.elements || []) as any[];
    expect(openedElements).toHaveLength(1);
    expect(openedElements[0].data.topic.children[0].text).toBe('TODOS');
  });
});
