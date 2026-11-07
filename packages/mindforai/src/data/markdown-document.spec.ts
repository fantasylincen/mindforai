// 验证 mindforai 树与 Markdown 文本的互相转换以及 Markdown 末尾清单字段的追加与提取
import {
  appendManifestFieldToMarkdown,
  extractMarkdownManifestField,
  parseMarkdownDocumentToMindForAIData,
  serializeMindForAITreeAsMarkdown,
} from './markdown-document';

describe('markdown document', () => {
  it('serializes a mindforai tree into nested markdown headings', () => {
    const markdown = serializeMindForAITreeAsMarkdown([
      {
        text: 'Root',
        children: [
          'Leaf',
          { text: 'Branch', children: ['Child A', 'Child B'] },
        ],
      },
    ]);

    expect(markdown).toBe(['# Root', 'Leaf', '', '## Branch', '', '- Child A', '- Child B'].join('\n'));
  });

  it('appends and extracts the manifest field at the end of markdown', () => {
    const text = appendManifestFieldToMarkdown('# Title', 'ABCDEF');
    expect(text.endsWith('manifest: ABCDEF')).toBe(true);
    expect(extractMarkdownManifestField(text)).toBe('ABCDEF');
  });

  it('returns undefined when the markdown has no manifest field', () => {
    expect(extractMarkdownManifestField('# Title\n\ncontent')).toBeUndefined();
  });

  it('parses markdown with manifest into mindforai data', () => {
    const data = parseMarkdownDocumentToMindForAIData('# Title\n\n- one\n- two\n\nmanifest: ZIPBASE64');
    expect(data.type).toBe('mindforai');
    expect(data.manifest).toBe('ZIPBASE64');
    expect(data.content.length).toBeGreaterThan(0);
  });
});
