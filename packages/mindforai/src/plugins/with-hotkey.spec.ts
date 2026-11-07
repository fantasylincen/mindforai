// 验证快捷键插件对撤销重做快捷键的处理逻辑
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaitBoard } from '@plait/core';
import { buildMindForAIHotkeyPlugin } from './with-hotkey';

type MockBoard = {
  undo: ReturnType<typeof vi.fn>;
  redo: ReturnType<typeof vi.fn>;
  globalKeyDown: ReturnType<typeof vi.fn>;
  keyDown: ReturnType<typeof vi.fn>;
};

const createMockBoard = (): MockBoard => ({
  undo: vi.fn(),
  redo: vi.fn(),
  globalKeyDown: vi.fn(),
  keyDown: vi.fn(),
});

const createKeyEvent = (overrides: Record<string, unknown> = {}) => {
  return {
    key: 'z',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: {},
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as KeyboardEvent;
};

const wrapBoard = (mockBoard: MockBoard) => {
  const originalGlobalKeyDown = mockBoard.globalKeyDown;
  const originalKeyDown = mockBoard.keyDown;
  const withMindForAIHotkey = buildMindForAIHotkeyPlugin(() => undefined);
  const wrapped = withMindForAIHotkey(mockBoard as unknown as PlaitBoard) as unknown as PlaitBoard;
  return {
    wrapped,
    originalGlobalKeyDown,
    originalKeyDown,
  };
};

describe('undo redo hotkey', () => {
  beforeEach(() => {
    vi.spyOn(PlaitBoard, 'hasBeenTextEditing').mockReturnValue(false);
    vi.spyOn(PlaitBoard, 'getMovingPointInBoard').mockReturnValue(null as any);
    vi.spyOn(PlaitBoard, 'isMovingPointInBoard').mockReturnValue(false as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('undoes once when ctrl+z fires in both global and board handlers', () => {
    const mockBoard = createMockBoard();
    const board = wrapBoard(mockBoard);
    const event = createKeyEvent();

    board.wrapped.globalKeyDown(event);
    board.wrapped.keyDown(event);

    expect(mockBoard.undo).toHaveBeenCalledTimes(1);
    expect(mockBoard.redo).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('redoes once when ctrl+y is pressed', () => {
    const mockBoard = createMockBoard();
    const board = wrapBoard(mockBoard);
    const event = createKeyEvent({ key: 'y' });

    board.wrapped.globalKeyDown(event);

    expect(mockBoard.redo).toHaveBeenCalledTimes(1);
    expect(mockBoard.undo).not.toHaveBeenCalled();
  });

  it('redoes once when ctrl+shift+z is pressed', () => {
    const mockBoard = createMockBoard();
    const board = wrapBoard(mockBoard);
    const event = createKeyEvent({ shiftKey: true });

    board.wrapped.keyDown(event);

    expect(mockBoard.redo).toHaveBeenCalledTimes(1);
    expect(mockBoard.undo).not.toHaveBeenCalled();
  });

  it('leaves text editing untouched', () => {
    vi.spyOn(PlaitBoard, 'hasBeenTextEditing').mockReturnValue(true);
    const mockBoard = createMockBoard();
    const board = wrapBoard(mockBoard);
    const event = createKeyEvent();

    board.wrapped.keyDown(event);

    expect(mockBoard.undo).not.toHaveBeenCalled();
    expect(board.originalKeyDown).toHaveBeenCalledTimes(1);
  });

  it('ignores plain key presses without the modifier', () => {
    const mockBoard = createMockBoard();
    const board = wrapBoard(mockBoard);
    const event = createKeyEvent({ ctrlKey: false, metaKey: false, key: 'v' });

    board.wrapped.globalKeyDown(event);

    expect(mockBoard.undo).not.toHaveBeenCalled();
    expect(mockBoard.redo).not.toHaveBeenCalled();
  });
});
