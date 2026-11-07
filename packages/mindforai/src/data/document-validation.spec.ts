// 校验文档格式识别、解析错误定位以及格式化行为
import {
  detectDocumentFormat,
  resolveDocumentFormatByHeader,
  resolveDocumentFormatByName,
} from './document-format';
import { formatDocumentContents, validateDocumentContents } from './document-validation';
import { parseMindForAIText, serializeMindForAIText } from './mindforai-text';

const buildFile = (name: string, type = '') => new File([''], name, { type });

const validMindForAIText = [
  'type: mindforai',
  'version: 1',
  'content[1]:',
  '  - text: TODOS',
  '    children[2]:',
  '      - AAAAAAAAAA',
  '      - text: 规则',
  '        children[1]:',
  '          - BBBB',
].join('\n');

const validDrawnixLiteText = JSON.stringify(
  {
    type: 'drawnixlite',
    version: 1,
    content: [{ text: 'root', children: [{ text: 'child' }] }],
  },
  null,
  2
);

describe('document format detection', () => {
  it('prefers the file extension', () => {
    expect(resolveDocumentFormatByName('board.mindforai')).toBe('mindforai');
    expect(resolveDocumentFormatByName('board.drawnixlite')).toBe('drawnixlite');
    expect(resolveDocumentFormatByName('board.drawnix')).toBeNull();
    expect(resolveDocumentFormatByName('board.smalldrawnix')).toBeNull();
    expect(resolveDocumentFormatByName('board.txt')).toBeNull();
    expect(detectDocumentFormat(buildFile('board.mindforai'))).toEqual({
      format: 'mindforai',
      source: 'name',
    });
  });

  it('falls back to the document header', () => {
    expect(resolveDocumentFormatByHeader('type: mindforai\nversion: 1')).toBe('mindforai');
    expect(resolveDocumentFormatByHeader('{\n  "type": "drawnixlite"')).toBe('drawnixlite');
    expect(resolveDocumentFormatByHeader('{\n  "type": "drawnix"')).toBeNull();
    expect(resolveDocumentFormatByHeader('{\n  "type": "smalldrawnix"')).toBeNull();
    expect(resolveDocumentFormatByHeader('{"type": "mindforai"}')).toBe('mindforai');
    expect(resolveDocumentFormatByHeader('{"type": "other"}')).toBeNull();
    expect(detectDocumentFormat(buildFile('board'), 'type: mindforai').format).toBe('mindforai');
    expect(detectDocumentFormat(buildFile('board'), '{"type":"other"}').format).toBeNull();
  });
});

describe('mindforai text validation', () => {
  it('accepts a valid document', () => {
    const result = validateDocumentContents(validMindForAIText, 'mindforai');

    expect(result.ok).toBe(true);
    expect(result.data?.elements).toHaveLength(1);
    expect(result.issues).toEqual([]);
  });

  it('locates malformed indentation', () => {
    const broken = validMindForAIText.replace('      - text: 规则', '   - text: 规则');
    const result = validateDocumentContents(broken, 'mindforai');

    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.code === 'invalidIndent' && issue.line === 7)).toBe(
      true
    );
  });

  it('locates a children count mismatch', () => {
    const broken = validMindForAIText.replace('children[2]:', 'children[3]:');
    const result = validateDocumentContents(broken, 'mindforai');

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'childrenCountMismatch')).toBe(true);
  });

  it('reports a missing type header', () => {
    const broken = validMindForAIText.replace('type: mindforai\n', '');
    const result = validateDocumentContents(broken, 'mindforai');

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'missingType')).toBe(true);
  });

  it('rejects inline children content', () => {
    const broken = validMindForAIText.replace(
      '    children[2]:',
      '    children[2]: "AAAAAAAAAA",BBBBBBBBBBB'
    );
    const result = validateDocumentContents(broken, 'mindforai');

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'inlineChildrenContent')).toBe(true);
  });
});

describe('json document validation', () => {
  it('accepts a valid drawnixlite document', () => {
    const result = validateDocumentContents(validDrawnixLiteText, 'drawnixlite');

    expect(result.ok).toBe(true);
    expect(result.data?.elements).toHaveLength(1);
  });

  it('locates the json syntax error', () => {
    const broken = '{\n  "type": "drawnixlite",\n  "version": 1,\n  "content": [';
    const result = validateDocumentContents(broken, 'drawnixlite');

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe('jsonSyntax');
    expect(result.issues[0].line).toBeGreaterThan(1);
  });

  it('reports missing content', () => {
    const broken = JSON.stringify({ type: 'drawnixlite', version: 1 }, null, 2);
    const result = validateDocumentContents(broken, 'drawnixlite');

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'missingCompactContent')).toBe(true);
  });
});

describe('document formatting', () => {
  it('formats valid mindforai text with the canonical serializer', () => {
    const formatted = formatDocumentContents(validMindForAIText, 'mindforai');
    const parsed = parseMindForAIText(validMindForAIText);

    expect(formatted.issues).toEqual([]);
    expect(formatted.text).toBe(serializeMindForAIText(parsed!));
  });

  it('normalizes indentation when the structure is still readable', () => {
    const messy = [
      'type: mindforai',
      'version: 1',
      'content[1]:',
      '   - text: TODOS',
      '      children[1]:',
      '         - AAAAAAAAAA',
    ].join('\n');
    const formatted = formatDocumentContents(messy, 'mindforai');

    expect(formatted.text).toContain('  - text: TODOS');
    expect(validateDocumentContents(formatted.text, 'mindforai').ok).toBe(true);
  });

  it('pretty prints drawnixlite json and keeps syntax errors', () => {
    const compact = '{"type":"drawnixlite","version":1,"content":[]}';
    expect(formatDocumentContents(compact, 'drawnixlite').text).toContain(
      '\n  "type": "drawnixlite"'
    );

    const broken = formatDocumentContents('{"type":', 'drawnixlite');
    expect(broken.text).toBe('{"type":');
    expect(broken.issues[0].code).toBe('jsonSyntax');
  });
});
