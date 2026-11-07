import { describe, expect, it } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import { setupMindForAITestingBoard } from '../../../../testing';
import type { MindForAITestingBoardFixture } from '../../../../testing';
import {
  collapseOrExpandAllDescendants,
  collapseOrExpandChildren,
  getAllDescendants,
} from './expand-collapse';

const buildMind = () => ({
  id: 'root',
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
  children: [
    {
      id: 'child-1',
      type: 'mind_child' as const,
      data: { topic: { children: [{ text: 'a' }], type: 'paragraph' } },
      children: [
        {
          id: 'grandchild-1',
          type: 'mind_child' as const,
          data: { topic: { children: [{ text: 'a1' }], type: 'paragraph' } },
          children: [
            {
              id: 'great-grandchild-1',
              type: 'mind_child' as const,
              data: { topic: { children: [{ text: 'a11' }], type: 'paragraph' } },
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'child-2',
      type: 'mind_child' as const,
      data: { topic: { children: [{ text: 'b' }], type: 'paragraph' } },
      children: [],
    },
  ],
});

type RawMindNode = {
  id: string;
  type: 'mind' | 'mind_child';
  layout?: MindLayoutType;
  points?: [[number, number]];
  data: { topic: { children: { text: string }[]; type: 'paragraph' } };
  children: RawMindNode[];
};

// 用固定种子的伪随机数生成可复现的随机树
const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const buildRandomMindTree = (seed: number, depth: number = 4) => {
  const random = createSeededRandom(seed);
  const visitedIds = new Set<string>();
  let idCounter = 0;
  const createId = () => {
    let id = `n-${idCounter++}`;
    while (visitedIds.has(id)) {
      id = `n-${idCounter++}`;
    }
    visitedIds.add(id);
    return id;
  };
  const createNode = (level: number): RawMindNode => {
    const id = createId();
    const node: RawMindNode = {
      id,
      type: 'mind_child',
      data: { topic: { children: [{ text: id }], type: 'paragraph' } },
      children: [],
    };
    if (level < depth) {
      const childCount = 1 + Math.floor(random() * 4);
      for (let index = 0; index < childCount; index++) {
        node.children.push(createNode(level + 1));
      }
    }
    return node;
  };
  const root: RawMindNode = {
    id: 'root',
    type: 'mind',
    layout: MindLayoutType.right,
    points: [[0, 0]],
    data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
    children: [],
  };
  const childCount = 1 + Math.floor(random() * 4);
  for (let index = 0; index < childCount; index++) {
    root.children.push(createNode(2));
  }
  return root;
};

const collectExpectedDescendantIds = (root: RawMindNode): string[] => {
  const result: string[] = [];
  const walk = (node: RawMindNode) => {
    for (const child of node.children) {
      result.push(child.id);
      walk(child);
    }
  };
  walk(root);
  return result;
};

const flattenNodes = (root: RawMindNode): RawMindNode[] => {
  const result: RawMindNode[] = [root];
  const walk = (node: RawMindNode) => {
    for (const child of node.children) {
      result.push(child);
      walk(child);
    }
  };
  walk(root);
  return result;
};

describe('collapse or expand mind children', () => {
  let fixture: MindForAITestingBoardFixture | undefined;

  const setup = () => {
    fixture = setupMindForAITestingBoard([], [buildMind() as any]);
    return fixture.board;
  };

  it('collects all descendants in a flat array excluding the node itself', () => {
    const board = setup();
    const root = board.children[0] as any;
    const ids = getAllDescendants(root).map((element: any) => element.id);
    expect(ids).toEqual(['child-1', 'grandchild-1', 'great-grandchild-1', 'child-2']);
    fixture?.destroy();
  });

  it('collapses only the first level children', () => {
    const board = setup();
    collapseOrExpandChildren(board, board.children[0] as any, true);
    const root = board.children[0] as any;
    expect(root.isCollapsed).toBe(true);
    expect(root.children[0].isCollapsed).toBeUndefined();
    expect(root.children[0].children[0].isCollapsed).toBeUndefined();
    expect(root.children[1].isCollapsed).toBeUndefined();
    fixture?.destroy();
  });

  it('expands only the first level children', () => {
    const board = setup();
    collapseOrExpandAllDescendants(board, board.children[0] as any, true);
    collapseOrExpandChildren(board, board.children[0] as any, false);
    const root = board.children[0] as any;
    expect(root.isCollapsed).toBeFalsy();
    expect(root.children[0].isCollapsed).toBe(true);
    fixture?.destroy();
  });

  it('collapses all descendants down to leaf nodes while keeping the root expanded', () => {
    const board = setup();
    collapseOrExpandAllDescendants(board, board.children[0] as any, true);
    const root = board.children[0] as any;
    expect(root.isCollapsed).toBeFalsy();
    expect(root.children[0].isCollapsed).toBe(true);
    expect(root.children[0].children[0].isCollapsed).toBe(true);
    expect(root.children[0].children[0].children[0].isCollapsed).toBeUndefined();
    fixture?.destroy();
  });

  it('expands all descendants that have children', () => {
    const board = setup();
    collapseOrExpandAllDescendants(board, board.children[0] as any, true);
    collapseOrExpandAllDescendants(board, board.children[0] as any, false);
    const root = board.children[0] as any;
    expect(root.isCollapsed).toBeFalsy();
    expect(root.children[0].isCollapsed).toBe(false);
    expect(root.children[0].children[0].isCollapsed).toBe(false);
    fixture?.destroy();
  });

  it('keeps the root expanded so it can always be expanded again', () => {
    const board = setup();
    collapseOrExpandAllDescendants(board, board.children[0] as any, true);
    const root = board.children[0] as any;
    expect(root.isCollapsed).toBeFalsy();
    expect(root.children.length).toBe(2);
    expect(root.children[0].isCollapsed).toBe(true);
    expect(root.children[1].isCollapsed).toBeUndefined();
    fixture?.destroy();
  });

  it('getAllDescendants returns every descendant of a random 4-level tree', () => {
    for (const seed of [1, 7, 42, 2024, 99991]) {
      const rawTree = buildRandomMindTree(seed, 4);
      const expectedIds = collectExpectedDescendantIds(rawTree);
      const allNodes = flattenNodes(rawTree);
      expect(expectedIds.length).toBe(allNodes.length - 1);
      expect(expectedIds.length).toBeGreaterThan(0);

      const localFixture = setupMindForAITestingBoard([], [rawTree as any]);
      const root = localFixture.board.children[0] as any;
      const descents = getAllDescendants(root);
      const returnedIds = descents.map((node: any) => node.id);

      expect(returnedIds.length).toBe(expectedIds.length);
      expect(new Set(returnedIds)).toEqual(new Set(expectedIds));
      expect(returnedIds).not.toContain('root');
      expect(new Set(returnedIds).size).toBe(returnedIds.length);
      localFixture.destroy();
    }
  });

  it('collapse / expand all covers every level of a random 4-level tree', () => {
    for (const seed of [3, 11, 88, 31415]) {
      const rawTree = buildRandomMindTree(seed, 4);
      const localFixture = setupMindForAITestingBoard([], [rawTree as any]);
      const board = localFixture.board;

      collapseOrExpandAllDescendants(board, board.children[0] as any, true);
      const collapsedAll = flattenNodes(board.children[0] as unknown as RawMindNode) as any[];
      for (const node of collapsedAll) {
        if (node.id === 'root') {
          expect(node.isCollapsed).toBeFalsy();
        } else if (node.children.length > 0) {
          expect(node.isCollapsed).toBe(true);
        } else {
          expect(node.isCollapsed).toBeFalsy();
        }
      }

      collapseOrExpandAllDescendants(board, board.children[0] as any, false);
      const expandedAll = flattenNodes(board.children[0] as unknown as RawMindNode) as any[];
      for (const node of expandedAll) {
        if (node.children.length > 0) {
          expect(node.isCollapsed).toBe(false);
        }
      }
      localFixture.destroy();
    }
  });
});
