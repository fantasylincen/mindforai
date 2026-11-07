// 校验 mindforai 文本树的序列化与解析行为，覆盖叶子独行、无引号和旧格式兼容
import { parseMindForAIText, serializeMindForAIText } from './mindforai-text';
import { MindForAIExportedData } from './types';

const buildDocument = (content: MindForAIExportedData['content']): MindForAIExportedData => ({
  type: 'mindforai',
  version: 1,
  content,
});

describe('mindforai text format', () => {
  it('writes every leaf node on its own line without double quotes', () => {
    const document = buildDocument([
      {
        text: 'TODOS',
        children: [
          'XXXXXXXXXXXXXXXXXXXX',
          {
            text: '规则',
            children: ['AAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDD'],
          },
        ],
      },
    ]);

    expect(serializeMindForAIText(document)).toBe(
      [
        'type: mindforai',
        'version: 1',
        'content[1]:',
        '  - text: TODOS',
        '    children[2]:',
        '      - XXXXXXXXXXXXXXXXXXXX',
        '      - text: 规则',
        '        children[4]:',
        '          - AAAAAAAAA',
        '          - BBBBBBBBBBB',
        '          - CCCCCCCCCCC',
        '          - DDDDDDDDD',
      ].join('\n')
    );
  });

  it('round trips nested content and special characters', () => {
    const document = buildDocument([
      'root, with: symbols "x"',
      {
        text: '多行\n文本',
        children: ['a,b', 'a: b', '123', 'true', '  spaced', 'text: x', 'line\\nbreak'],
      },
    ]);

    const text = serializeMindForAIText(document);

    expect(text).not.toContain('"root');
    expect(parseMindForAIText(text)).toEqual(document);
  });

  it('keeps empty content readable', () => {
    const text = serializeMindForAIText(buildDocument([]));

    expect(text).toBe('type: mindforai\nversion: 1\ncontent: []');
    expect(parseMindForAIText(text)).toEqual(buildDocument([]));
  });

  it('leaves the previous inline toon leaf form to the legacy decoder', () => {
    const legacy = [
      'type: mindforai',
      'version: 1',
      'content[1]:',
      '  - text: TODOS',
      '    children[2]: "AAAAAAAAA",BBBBBBBBBBB',
    ].join('\n');

    expect(parseMindForAIText(legacy)).toBeNull();
  });

  it('rejects unrelated text', () => {
    expect(parseMindForAIText('content[1]: a')).toBeNull();
    expect(parseMindForAIText('type: drawnix\nversion: 1')).toBeNull();
  });

  it('appends and reads back the embedded manifest field', () => {
    const document: MindForAIExportedData = {
      ...buildDocument(['ROOT']),
      manifest: 'QUJDREVG',
    };
    const text = serializeMindForAIText(document);

    expect(text.endsWith('manifest: QUJDREVG')).toBe(true);
    expect(parseMindForAIText(text)).toEqual(document);
  });

  it('keeps the manifest field for empty content', () => {
    const document: MindForAIExportedData = {
      ...buildDocument([]),
      manifest: 'QUJDREVG',
    };
    const text = serializeMindForAIText(document);

    expect(text).toBe('type: mindforai\nversion: 1\ncontent: []\nmanifest: QUJDREVG');
    expect(parseMindForAIText(text)).toEqual(document);
  });
});
