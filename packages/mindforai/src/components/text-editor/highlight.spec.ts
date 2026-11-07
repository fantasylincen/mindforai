// 校验文本编辑器的逐行语法着色结果
import { tokenizeDocumentLine } from './highlight';

const typesOf = (line: string, format: 'mindforai' | 'drawnixlite') =>
  tokenizeDocumentLine(line, format).map((token) => token.type);

describe('document line highlighting', () => {
  it('highlights mindforai structure keywords', () => {
    expect(typesOf('type: mindforai', 'mindforai')).toEqual(['key', 'value']);
    expect(typesOf('    children[2]:', 'mindforai')).toEqual(['plain', 'key']);
    expect(typesOf('  - text: TODOS', 'mindforai')).toEqual(['plain', 'marker', 'key', 'value']);
    expect(typesOf('      - AAAAAAAAAA', 'mindforai')).toEqual(['plain', 'marker', 'value']);
  });

  it('highlights json keys and values', () => {
    expect(typesOf('  "type": "drawnixlite",', 'drawnixlite')).toEqual([
      'plain',
      'key',
      'punctuation',
      'plain',
      'string',
      'punctuation',
    ]);
    expect(typesOf('  "count": 2,', 'drawnixlite')).toEqual([
      'plain',
      'key',
      'punctuation',
      'plain',
      'number',
      'punctuation',
    ]);
    expect(typesOf('  "ok": true', 'drawnixlite')).toEqual([
      'plain',
      'key',
      'punctuation',
      'plain',
      'boolean',
    ]);
  });

  it('keeps the original text intact', () => {
    const line = '  - text: TODOS';
    const joined = tokenizeDocumentLine(line, 'mindforai')
      .map((token) => token.text)
      .join('');

    expect(joined).toBe(line);
  });
});
