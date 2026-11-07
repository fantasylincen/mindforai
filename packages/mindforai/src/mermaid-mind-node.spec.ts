import { describe, expect, it } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import { setupMindForAITestingBoard } from '../testing';
import {
  createMermaidMindElement,
  DEFAULT_MERMAID_FLOWCHART,
  insertMermaidMindNode,
} from './mermaid-mind-node';
import { getMermaidDefinition, getMermaidMindData } from './mermaid-mind';

const buildMind = () => ({
  id: 'root',
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
  children: [],
});

describe('mermaid mind node', () => {
  it('keeps the flowchart definition in the node topic', () => {
    const element = createMermaidMindElement(DEFAULT_MERMAID_FLOWCHART);
    expect(getMermaidDefinition(element)).toBe(DEFAULT_MERMAID_FLOWCHART);
    expect(getMermaidMindData(element)).not.toBeNull();
    expect(element.children).toEqual([]);
  });

  it('inserts the flowchart node as a child of the selected node', () => {
    const fixture = setupMindForAITestingBoard([], [buildMind() as any]);
    const board = fixture.board;
    const root = board.children[0] as any;
    const element = insertMermaidMindNode(board, root, DEFAULT_MERMAID_FLOWCHART);
    const updatedRoot = board.children[0] as any;
    expect(updatedRoot.children.length).toBe(1);
    expect(updatedRoot.children[0].id).toBe(element.id);
    expect(getMermaidDefinition(updatedRoot.children[0])).toBe(DEFAULT_MERMAID_FLOWCHART);
    fixture.destroy();
  });
});
