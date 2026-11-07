import { isMindForAIDocumentFile } from './drop-open';

const buildFile = (name: string, type = '') => new File(['{}'], name, { type });

describe('drop open', () => {
  it('recognizes drawnixlite and mindforai files', () => {
    expect(isMindForAIDocumentFile(buildFile('board.drawnixlite'))).toBe(true);
    expect(isMindForAIDocumentFile(buildFile('board.mindforai'))).toBe(true);
    expect(isMindForAIDocumentFile(buildFile('board.drawnix'))).toBe(false);
    expect(isMindForAIDocumentFile(buildFile('board.smalldrawnix'))).toBe(false);
    expect(isMindForAIDocumentFile(buildFile('board.png', 'image/png'))).toBe(false);
  });

  it('recognizes markdown files', () => {
    expect(isMindForAIDocumentFile(buildFile('README.md'))).toBe(true);
    expect(isMindForAIDocumentFile(buildFile('notes.MD'))).toBe(true);
  });

  it('recognizes document mime types without extension', () => {
    expect(isMindForAIDocumentFile(buildFile('board', 'application/vnd.drawnixlite+json'))).toBe(
      true
    );
    expect(isMindForAIDocumentFile(buildFile('board', 'application/vnd.mindforai+toon'))).toBe(
      true
    );
    expect(isMindForAIDocumentFile(buildFile('board', 'application/vnd.drawnix+json'))).toBe(
      false
    );
    expect(
      isMindForAIDocumentFile(buildFile('board', 'application/vnd.smalldrawnix+json'))
    ).toBe(false);
  });
});
