import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaitBoard } from '@plait/core';
import { fileSave } from './filesystem';
import { saveDocumentAsFormat, saveDocumentToCurrentFile } from './document-save';
import { parseMindForAIText } from './mindforai-text';
import { MindForAIBoard, MindForAIState } from '../hooks/use-mindforai';

vi.mock('./filesystem', () => ({
  fileSave: vi.fn(),
  fileOpen: vi.fn(),
}));

const fileSaveMock = vi.mocked(fileSave);

const buildBoard = (filePath: string | null, fileHandle: any = null) => {
  let appState: MindForAIState = {
    toolState: {} as any,
    isMobile: false,
    fileHandle,
    filePath,
    isDirty: true,
    openCleanConfirm: false,
    exportTransparent: false,
  };
  const showToast = vi.fn();
  const board = {
    children: [
      {
        id: 'root',
        type: 'mind',
        points: [[0, 0]],
        data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
        children: [],
      },
    ],
    viewport: { zoom: 1 },
    theme: { themeColorMode: 'default' },
    get appState() {
      return appState;
    },
    setMindForAIAppState: (updater: (state: MindForAIState) => MindForAIState) => {
      appState = updater(appState);
    },
    showToast,
  };
  return {
    board: board as unknown as MindForAIBoard & PlaitBoard,
    showToast,
    getAppState: () => appState,
  };
};

const getSavedPayload = async () => {
  const [blob, options] = fileSaveMock.mock.calls[0];
  const text = await (blob as Blob).text();
  return { payload: JSON.parse(text), options: options as any };
};

const getSavedToonPayload = async () => {
  const [blob, options] = fileSaveMock.mock.calls[0];
  const text = await (blob as Blob).text();
  return { payload: parseMindForAIText(text) as any, text, options: options as any };
};

beforeEach(() => {
  fileSaveMock.mockReset();
  fileSaveMock.mockResolvedValue({ name: 'saved' } as any);
});

describe('save current document', () => {
  it('overwrites a drawnixlite file with drawnixlite content', async () => {
    const handle = { name: 'board.drawnixlite' };
    fileSaveMock.mockResolvedValue({ name: 'board.drawnixlite' } as any);
    const { board, showToast, getAppState } = buildBoard('board.drawnixlite', handle);

    const isSaved = await saveDocumentToCurrentFile(board);

    expect(isSaved).toBe(true);
    const { payload, options } = await getSavedPayload();
    expect(payload.type).toBe('drawnixlite');
    expect(payload.content[0].text).toBe('root');
    expect(options.name).toBe('board');
    expect(options.extension).toBe('drawnixlite');
    expect(options.fileHandle).toBe(handle);
    expect(getAppState().isDirty).toBe(false);
    expect(getAppState().filePath).toBe('board.drawnixlite');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('overwrites a mindforai file with compact toon content', async () => {
    const handle = { name: 'board.mindforai' };
    fileSaveMock.mockResolvedValue({ name: 'board.mindforai' } as any);
    const { board, showToast, getAppState } = buildBoard('board.mindforai', handle);

    const isSaved = await saveDocumentToCurrentFile(board);

    expect(isSaved).toBe(true);
    const { payload, text, options } = await getSavedToonPayload();
    expect(text.startsWith('type: mindforai')).toBe(true);
    expect(text).not.toContain('mind_child');
    expect(payload.type).toBe('mindforai');
    expect(payload.content).toEqual(['root']);
    expect(options.name).toBe('board');
    expect(options.extension).toBe('mindforai');
    expect(options.fileHandle).toBe(handle);
    expect(getAppState().isDirty).toBe(false);
    expect(getAppState().filePath).toBe('board.mindforai');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('uses the real saved file name when saving a new document without a path', async () => {
    fileSaveMock.mockResolvedValue({ name: 'fresh-board.mindforai' } as any);
    const { board, getAppState } = buildBoard(null, null);

    await saveDocumentToCurrentFile(board);

    expect(getAppState().filePath).toBe('fresh-board.mindforai');
  });

  it('reports a failure toast without throwing', async () => {
    fileSaveMock.mockRejectedValue(new Error('disk error'));
    const { board, showToast, getAppState } = buildBoard('board.drawnixlite', {
      name: 'board.drawnixlite',
    });

    const isSaved = await saveDocumentToCurrentFile(board);

    expect(isSaved).toBe(false);
    expect(getAppState().isDirty).toBe(true);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('ignores aborted file pickers', async () => {
    const abortError = new Error('cancelled');
    abortError.name = 'AbortError';
    fileSaveMock.mockRejectedValue(abortError);
    const { board, showToast } = buildBoard(null, null);

    const isSaved = await saveDocumentToCurrentFile(board);

    expect(isSaved).toBe(false);
    expect(showToast).not.toHaveBeenCalled();
  });
});

describe('save as', () => {
  it('switches the current file to the save as target', async () => {
    fileSaveMock.mockResolvedValue({ name: 'board.drawnixlite' } as any);
    const { board, getAppState } = buildBoard('board.mindforai', { name: 'board.mindforai' });

    const isSaved = await saveDocumentAsFormat(board, 'drawnixlite');

    expect(isSaved).toBe(true);
    const { payload, options } = await getSavedPayload();
    expect(payload.type).toBe('drawnixlite');
    expect(options.name).toBe('board');
    expect(options.extension).toBe('drawnixlite');
    expect(options.fileHandle).toBeNull();
    expect(getAppState().filePath).toBe('board.drawnixlite');
  });

  it('uses the real saved file name after save as chooses a new name', async () => {
    fileSaveMock.mockResolvedValue({ name: 'renamed-board.drawnixlite' } as any);
    const { board, getAppState } = buildBoard('board.mindforai', { name: 'board.mindforai' });

    await saveDocumentAsFormat(board, 'drawnixlite');

    expect(getAppState().filePath).toBe('renamed-board.drawnixlite');
    expect(getAppState().fileHandle).toEqual({ name: 'renamed-board.drawnixlite' });
  });

  it('saves as mindforai from a drawnixlite file', async () => {
    fileSaveMock.mockResolvedValue({ name: 'board.mindforai' } as any);
    const { board, getAppState } = buildBoard('board.drawnixlite', { name: 'board.drawnixlite' });

    const isSaved = await saveDocumentAsFormat(board, 'mindforai');

    expect(isSaved).toBe(true);
    const { payload, options } = await getSavedToonPayload();
    expect(payload.type).toBe('mindforai');
    expect(payload.content).toEqual(['root']);
    expect(payload.elements).toBeUndefined();
    expect(options.name).toBe('board');
    expect(options.extension).toBe('mindforai');
    expect(getAppState().filePath).toBe('board.mindforai');
  });

  it('reports a failure toast without throwing', async () => {
    fileSaveMock.mockRejectedValue(new Error('disk error'));
    const { board, showToast } = buildBoard('board.mindforai', { name: 'board.mindforai' });

    const isSaved = await saveDocumentAsFormat(board, 'drawnixlite');

    expect(isSaved).toBe(false);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('saves as markdown and embeds the manifest at the end', async () => {
    fileSaveMock.mockResolvedValue({ name: 'board.md' } as any);
    const { board, getAppState } = buildBoard('board.mindforai', { name: 'board.mindforai' });

    const isSaved = await saveDocumentAsFormat(board, 'markdown');

    expect(isSaved).toBe(true);
    const [blob, options] = fileSaveMock.mock.calls[0];
    const text = await (blob as Blob).text();
    expect(text.startsWith('root')).toBe(true);
    expect(text).toMatch(/manifest: \S+/);
    expect(options.extension).toBe('md');
    expect(getAppState().filePath).toBe('board.md');
  });
});
