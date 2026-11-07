// 验证 Markdown 文档转换为 mindforai 树结构的核心场景
import { isMarkdownFileName, parseMarkdownToMindForAI } from './markdown-to-mindforai';
import { readDocumentFile } from './document-load';
import type { MindForAIBranchNode, MindForAINode } from './types';

const isBranch = (node: MindForAINode): node is MindForAIBranchNode =>
  typeof node === 'object' && node !== null;

const firstBranch = (nodes: MindForAINode[]): MindForAIBranchNode => {
  const node = nodes.find(isBranch);
  if (!node) {
    throw new Error('expected a branch node');
  }
  return node;
};

describe('markdown to mindforai', () => {
  it('recognizes markdown file names', () => {
    expect(isMarkdownFileName('README.md')).toBe(true);
    expect(isMarkdownFileName('AGENTS.MD')).toBe(true);
    expect(isMarkdownFileName('board.mindforai')).toBe(false);
  });

  it('builds heading hierarchy with nested sections', () => {
    const source = [
      '# Title',
      '',
      'Intro paragraph.',
      '',
      '## Section A',
      '',
      '- item 1',
      '- item 2',
      '',
      '### Sub A1',
      '',
      'Sub text',
      '',
      '## Section B',
      '',
      'B text',
    ].join('\n');
    const data = parseMarkdownToMindForAI(source);
    const root = firstBranch(data.content);
    expect(root.text).toBe('Title');
    expect(root.children).toContain('Intro paragraph.');
    const sectionA = firstBranch(root.children);
    expect(sectionA.text).toBe('Section A');
    const items = sectionA.children.find(isBranch);
    expect(items?.children).toEqual(['item 1', 'item 2']);
    const subA1 = sectionA.children.find(
      (child) => isBranch(child) && child.text === 'Sub A1'
    ) as MindForAIBranchNode;
    expect(subA1.children).toEqual(['Sub text']);
    const sectionB = root.children.find(
      (child) => isBranch(child) && child.text === 'Section B'
    ) as MindForAIBranchNode;
    expect(sectionB.children).toEqual(['B text']);
  });

  it('handles nested lists, quotes, tables and code fences', () => {
    const source = [
      '# Doc',
      '',
      '- root',
      '  - child',
      '    - grandchild',
      '',
      '> quoted line',
      '',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '```js',
      'const x = 1;',
      '```',
    ].join('\n');
    const data = parseMarkdownToMindForAI(source);
    const root = firstBranch(data.content);
    const list = firstBranch(root.children);
    expect(list.text).toBe('root');
    const child = firstBranch(list.children);
    expect(child.text).toBe('child');
    expect(child.children).toEqual(['grandchild']);
    expect(root.children.some((child) => isBranch(child) && child.text.startsWith('引用：'))).toBe(
      true
    );
    const table = root.children.find((child) => isBranch(child) && child.text === '表格');
    expect(table && isBranch(table) ? table.children : []).toEqual(['a | b', '1 | 2']);
    const code = root.children.find((child) => isBranch(child) && child.text === '代码块');
    expect(code && isBranch(code) ? code.children.length : 0).toBe(1);
  });

  it('cleans inline markdown syntax', () => {
    const data = parseMarkdownToMindForAI('# **Bold** `code` [link](https://x.com)');
    expect(firstBranch(data.content).text).toBe('Bold code link');
  });

  it('opens markdown files through the document loader', async () => {
    const file = new File(['# Title\n\n- one\n- two'], 'README.md', { type: 'text/markdown' });
    const loaded = await readDocumentFile(file);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.elements.length).toBeGreaterThan(0);
    }
  });
});
