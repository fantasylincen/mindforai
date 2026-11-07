import { describe, expect, it } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import { clearNodeWeakMapByNodes } from '@plait/core';
import { setupMindForAITestingBoard } from '../../testing';
import { findNodeMatches, revealNodeMatch } from './node-search';

const buildTree = () => ({
  id: 'root',
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
  children: [
    {
      id: 'child-1',
      type: 'mind_child' as const,
      isCollapsed: true,
      data: { topic: { children: [{ text: 'child' }], type: 'paragraph' } },
      children: [
        {
          id: 'grandchild-1',
          type: 'mind_child' as const,
          data: { topic: { children: [{ text: 'needle grandchild' }], type: 'paragraph' } },
          children: [],
        },
      ],
    },
  ],
});

const buildDeepTree = () => ({
  id: 'root',
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
  children: [
    {
      id: 'level-1',
      type: 'mind_child' as const,
      isCollapsed: true,
      data: { topic: { children: [{ text: 'level one' }], type: 'paragraph' } },
      children: [
        {
          id: 'level-2',
          type: 'mind_child' as const,
          isCollapsed: true,
          data: { topic: { children: [{ text: 'level two' }], type: 'paragraph' } },
          children: [
            {
              id: 'level-3',
              type: 'mind_child' as const,
              data: { topic: { children: [{ text: 'deep needle' }], type: 'paragraph' } },
              children: [],
            },
          ],
        },
      ],
    },
  ],
});

describe('node search reveal', () => {
  it('finds matches inside collapsed nodes', () => {
    const fixture = setupMindForAITestingBoard([], [buildTree() as any]);
    const matches = findNodeMatches(fixture.board, 'needle');
    expect(matches.length).toBe(1);
    expect(matches[0].elementId).toBe('grandchild-1');
    fixture.destroy();
  });

  it('expands collapsed ancestors even when hidden descendants were never mounted', () => {
    const fixture = setupMindForAITestingBoard([], [buildTree() as any]);
    const board = fixture.board;
    const root = board.children[0] as any;
    const grandchild = root.children[0].children[0];
    clearNodeWeakMapByNodes([grandchild]);
    const matches = findNodeMatches(board, 'needle');
    revealNodeMatch(board, matches[0], 'needle');
    expect((board.children[0] as any).children[0].isCollapsed).toBe(false);
    fixture.destroy();
  });

  it('expands every collapsed ancestor down to a deeply nested match', () => {
    const fixture = setupMindForAITestingBoard([], [buildDeepTree() as any]);
    const board = fixture.board;
    const matches = findNodeMatches(board, 'needle');
    expect(matches[0].elementId).toBe('level-3');
    revealNodeMatch(board, matches[0], 'needle');
    const levelOne = (board.children[0] as any).children[0];
    expect(levelOne.isCollapsed).toBe(false);
    expect(levelOne.children[0].isCollapsed).toBe(false);
    fixture.destroy();
  });

  it('expands ancestors when the match element reference is stale', () => {
    const fixture = setupMindForAITestingBoard([], [buildDeepTree() as any]);
    const board = fixture.board;
    const matches = findNodeMatches(board, 'needle');
    const staleMatch = { ...matches[0], element: { ...matches[0].element } as any };
    revealNodeMatch(board, staleMatch, 'needle');
    const levelOne = (board.children[0] as any).children[0];
    expect(levelOne.isCollapsed).toBe(false);
    expect(levelOne.children[0].isCollapsed).toBe(false);
    fixture.destroy();
  });
});