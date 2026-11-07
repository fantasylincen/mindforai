import { describe, expect, it } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import { setupMindForAITestingBoard } from '../../testing';
import { computeBoardFingerprint, computeNodeFingerprint } from './document-fingerprint';
import { computeMd5 } from '../utils/md5';

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
          children: [],
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

describe('document fingerprint', () => {
  it('counts all nodes and hashes texts in default order', () => {
    const { board } = setupMindForAITestingBoard([], [buildMind() as never]);
    const fingerprint = computeBoardFingerprint(board);
    expect(fingerprint.nodeCount).toBe(4);
    expect(fingerprint.md5).toBe(computeMd5('root' + 'a' + 'a1' + 'b'));
  });

  it('includes collapsed descendants in the fingerprint', () => {
    const root = buildMind();
    root.children[0].data = { topic: { children: [{ text: 'a' }], type: 'paragraph' } };
    (root.children[0] as any).isCollapsed = true;
    const { board } = setupMindForAITestingBoard([], [root as never]);
    const fingerprint = computeBoardFingerprint(board);
    expect(fingerprint.nodeCount).toBe(4);
  });

  it('computes a subtree fingerprint for a single node', () => {
    const { board } = setupMindForAITestingBoard([], [buildMind() as never]);
    const child = (board.children[0] as any).children[0];
    const fingerprint = computeNodeFingerprint(child);
    expect(fingerprint?.nodeCount).toBe(2);
    expect(fingerprint?.md5).toBe(computeMd5('aa1'));
  });
});
