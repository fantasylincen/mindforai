// 校验统一文档读取入口能识别正常文件并返回可定位的错误信息
import { readDocumentFile } from './document-load';

const validMindForAIText = [
  'type: mindforai',
  'version: 1',
  'content[1]:',
  '  - text: TODOS',
  '    children[1]:',
  '      - AAAAAAAAAA',
].join('\n');

const buildFile = (name: string, contents: string, type = '') =>
  new File([contents], name, { type });

describe('read document file', () => {
  it('loads a valid mindforai file', async () => {
    const loaded = await readDocumentFile(buildFile('board.toon', validMindForAIText));

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.elements).toHaveLength(1);
      expect(loaded.filePath).toBe('board.toon');
    }
  });

  it('returns original contents and issues for a broken mindforai file', async () => {
    const broken = validMindForAIText.replace('    children[1]:', '    children[3]:');
    const loaded = await readDocumentFile(buildFile('board.toon', broken));

    expect(loaded.ok).toBe(false);
    if (!loaded.ok) {
      expect(loaded.format).toBe('mindforai');
      expect(loaded.contents).toBe(broken);
      expect(loaded.issues.length).toBeGreaterThan(0);
    }
  });

  it('detects the format from the header when the name has no extension', async () => {
    const loaded = await readDocumentFile(buildFile('board', validMindForAIText));

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.elements).toHaveLength(1);
    }
  });

  it('returns json syntax issues for a broken drawnixlite file', async () => {
    const loaded = await readDocumentFile(
      buildFile('board.json', '{\n  "type": "drawnixlite",')
    );

    expect(loaded.ok).toBe(false);
    if (!loaded.ok) {
      expect(loaded.format).toBe('drawnixlite');
      expect(loaded.issues[0].code).toBe('jsonSyntax');
    }
  });

  it('opens a file without known extension by falling back to mindforai', async () => {
    const loaded = await readDocumentFile(buildFile('export', validMindForAIText));

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.elements).toHaveLength(1);
    }
  });

  it('opens a downloaded copy named with a suffix appended after the extension', async () => {
    const loaded = await readDocumentFile(buildFile('board.toon.txt', validMindForAIText));

    expect(loaded.ok).toBe(true);
  });
});
