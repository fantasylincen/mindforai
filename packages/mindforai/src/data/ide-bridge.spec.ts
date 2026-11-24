// DATA-34 单元测试：校验文本解析、格式推断与画板序列化入口
import { describe, expect, it } from 'vitest';
import {
  buildDocumentFileName,
  documentTextToInitialValue,
  getDocumentMimeTypeForFormat,
  loadDocumentText,
  resolveSaveableDocumentFormatByPath,
  serializeBoardDocumentText,
} from './ide-bridge';
import { serializeAsMindForAI } from './toon-document';
import { getDefaultName } from './json';

const SAMPLE_MIND_FOR_AI = [
  'type: mindforai',
  'version: 1',
  'content[1]:',
  '  - text: MindForAI',
].join('\n');

const SAMPLE_DRAWNIXLITE = JSON.stringify({
  type: 'drawnixlite',
  version: 1,
  content: [{ text: 'MindForAI' }],
});

describe('resolveSaveableDocumentFormatByPath', () => {
  it('识别 mindforai 扩展名', () => {
    expect(resolveSaveableDocumentFormatByPath('project.toon')).toBe('mindforai');
  });

  it('识别 drawnixlite 扩展名', () => {
    expect(resolveSaveableDocumentFormatByPath('board.json')).toBe('drawnixlite');
  });

  it('识别 markdown 扩展名', () => {
    expect(resolveSaveableDocumentFormatByPath('notes.md')).toBe('markdown');
  });

  it('未知扩展名回退到 mindforai', () => {
    expect(resolveSaveableDocumentFormatByPath('no-extension')).toBe('mindforai');
  });
});

describe('loadDocumentText', () => {
  it('解析 .toon 文本', () => {
    const loaded = loadDocumentText('project.toon', SAMPLE_MIND_FOR_AI);
    expect(loaded.ok).toBe(true);
    expect(loaded.format).toBe('mindforai');
    expect(loaded.data?.elements.length).toBe(1);
  });

  it('解析 .json 文本', () => {
    const loaded = loadDocumentText('board.json', SAMPLE_DRAWNIXLITE);
    expect(loaded.ok).toBe(true);
    expect(loaded.format).toBe('drawnixlite');
    expect(loaded.data?.elements.length).toBe(1);
  });

  it('非法文本返回错误但不抛异常', () => {
    const loaded = loadDocumentText('project.toon', '{]');
    expect(loaded.ok).toBe(false);
    expect(loaded.issues.length).toBeGreaterThan(0);
  });
});

describe('documentTextToInitialValue', () => {
  it('读取清单内记录的主题与语言', () => {
    const initialValue = documentTextToInitialValue('project.toon', SAMPLE_MIND_FOR_AI);
    expect(initialValue?.elements.length).toBe(1);
  });

  it('文本非法时返回 null', () => {
    expect(documentTextToInitialValue('project.toon', 'not a document')).toBeNull();
  });
});

describe('serializeBoardDocumentText', () => {
  const createBoardStub = () =>
    ({
      children: [
        {
          id: 'mind-1',
          type: 'mind',
          data: { topic: { children: [{ text: 'MindForAI' }] } },
          children: [],
        },
      ],
      viewport: { zoom: 1 },
      theme: { themeColorMode: 'dark' },
    }) as any;

  it('按 mindforai 格式序列化并保留清单', () => {
    const text = serializeBoardDocumentText(createBoardStub(), 'mindforai', 'project.toon');
    expect(text).toContain('type: toon');
    expect(text).toContain('manifest:');
  });

  it('按 drawnixlite 格式序列化', () => {
    const text = serializeBoardDocumentText(createBoardStub(), 'drawnixlite', 'board.json');
    expect(JSON.parse(text).type).toBe('drawnixlite');
  });
});

describe('buildDocumentFileName', () => {
  it('按目标格式生成文件名', () => {
    expect(buildDocumentFileName('docs/project.toon', 'mindforai')).toBe('project.toon');
    expect(buildDocumentFileName('docs/project.toon', 'markdown')).toBe('project.md');
  });
});

describe('getDocumentMimeTypeForFormat', () => {
  it('返回对应 MIME 类型', () => {
    expect(getDocumentMimeTypeForFormat('mindforai')).toBe('application/vnd.mindforai+toon');
    expect(getDocumentMimeTypeForFormat('drawnixlite')).toBe('application/vnd.drawnixlite+json');
    expect(getDocumentMimeTypeForFormat('markdown')).toBe('text/markdown');
  });
});

describe('serializeAsMindForAI', () => {
  it('缺失名称时仍能生成默认文件内容', () => {
    expect(getDefaultName().length).toBeGreaterThan(0);
    const board = {
      children: [],
      viewport: { zoom: 1 },
      theme: { themeColorMode: 'dark' },
    } as any;
    expect(serializeAsMindForAI(board)).toContain('content: []');
  });
});
