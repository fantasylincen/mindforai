// 验证关闭文件时画板、历史、选择与会话缓存都被重置
import { beforeEach, describe, expect, it } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import { setupMindForAITestingBoard } from '../../testing';
import { resetBoardToInitialState } from './document-reset';
import { readDocumentSession, writeDocumentSession } from './document-session';

const buildMind = () => ({
  id: 'root',
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
  children: [],
});

describe('reset board to initial state', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('clears board children, history and document session', () => {
    const fixture = setupMindForAITestingBoard([], [buildMind() as any]);
    const board = fixture.board;
    writeDocumentSession({
      type: 'mindforai-session',
      version: 1,
      documentText: 'root',
      isDirty: true,
      fileIdentity: { fileName: 'a.mindforai', filePath: 'a.mindforai' },
    });
    board.history.undos = [[{ type: 'remove_node' }] as any];

    resetBoardToInitialState(board);

    expect(board.children.length).toBe(0);
    expect(board.history.undos.length).toBe(0);
    expect(board.history.redos.length).toBe(0);
    expect(readDocumentSession()).toBeNull();
    fixture.destroy();
  });

  it('resets the viewport to 100% zoom', () => {
    const fixture = setupMindForAITestingBoard([], [buildMind() as any]);
    const board = fixture.board;
    board.viewport = { zoom: 3 } as any;

    resetBoardToInitialState(board);

    expect(board.viewport).toEqual({ zoom: 1 });
    fixture.destroy();
  });
});
