import { describe, expect, it, vi } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import {
  addSelectedElement,
  ELEMENT_TO_REF,
  getSelectedElements,
  Transforms,
  withOptions,
} from '@plait/core';
import { MIND_ELEMENT_TO_NODE } from '@plait/mind';
import { setupMindForAITestingBoard } from '../../testing';
import { findMermaidMindElementByPoint } from '../mermaid-mind-editing';
import { withMindExtend } from './with-mind-extend';

const buildMind = () => ({
  id: 'root',
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
  children: [
    {
      id: 'flowchart',
      type: 'mind_child' as const,
      data: { topic: { children: [{ text: 'flowchart TD\n A --> B' }], type: 'paragraph' } },
      children: [],
    },
  ],
});

/**
 * The mind layout is calculated by the react components, the node of the element is faked
 * to be able to detect the position of the rendered flowchart.
 */
const fakeLayoutNode = (element: any) => {
  MIND_ELEMENT_TO_NODE.set(element, {
    x: 100,
    y: 200,
    width: 240,
    height: 120,
    hGap: 0,
    vGap: 0,
    origin: element,
  } as any);
};

const fakeTextManage = (element: any) => {
  const edit = vi.fn();
  ELEMENT_TO_REF.set(element, {
    getTextManages: () => [{ isEditing: false, edit }],
  } as any);
  return edit;
};

describe('mind extend', () => {
  it('rejects inserting a child into a flowchart node', () => {
    const fixture = setupMindForAITestingBoard(
      [withOptions as any, withMindExtend as any],
      [buildMind() as any]
    );
    const board = fixture.board;
    Transforms.insertNode(
      board,
      {
        id: 'child',
        type: 'mind_child',
        data: { topic: { children: [{ text: 'child' }], type: 'paragraph' } },
        children: [],
      } as any,
      [0, 0, 0]
    );
    const root = board.children[0] as any;
    expect(root.children.length).toBe(1);
    expect(root.children[0].id).toBe('flowchart');
    fixture.destroy();
  });

  it('keeps the selection clean when the insertion is rejected', async () => {
    const fixture = setupMindForAITestingBoard(
      [withOptions as any, withMindExtend as any],
      [buildMind() as any]
    );
    const board = fixture.board;
    const flowchart = (board.children[0] as any).children[0];
    addSelectedElement(board, flowchart);
    Transforms.insertNode(
      board,
      {
        id: 'child',
        type: 'mind_child',
        data: { topic: { children: [{ text: 'child' }], type: 'paragraph' } },
        children: [],
      } as any,
      [0, 0, 0]
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getSelectedElements(board).some((element: any) => element.id === 'child')).toBe(false);
    fixture.destroy();
  });

  it('allows inserting a child into a regular mind node', () => {
    const fixture = setupMindForAITestingBoard(
      [withOptions as any, withMindExtend as any],
      [
        {
          id: 'root',
          type: 'mind',
          layout: MindLayoutType.right,
          points: [[0, 0]],
          data: { topic: { children: [{ text: 'root' }], type: 'paragraph' } },
          children: [
            {
              id: 'plain',
              type: 'mind_child',
              data: { topic: { children: [{ text: 'plain' }], type: 'paragraph' } },
              children: [],
            },
          ],
        } as any,
      ]
    );
    const board = fixture.board;
    Transforms.insertNode(
      board,
      {
        id: 'child',
        type: 'mind_child',
        data: { topic: { children: [{ text: 'child' }], type: 'paragraph' } },
        children: [],
      } as any,
      [0, 0, 0]
    );
    const root = board.children[0] as any;
    expect(root.children[0].children.length).toBe(1);
    expect(root.children[0].children[0].id).toBe('child');
    fixture.destroy();
  });

  it('finds the flowchart node by the position of the rendered flowchart', () => {
    const fixture = setupMindForAITestingBoard(
      [withOptions as any, withMindExtend as any],
      [buildMind() as any]
    );
    const board = fixture.board;
    const flowchart = (board.children[0] as any).children[0];
    fakeLayoutNode(flowchart);
    // the rendered flowchart is drawn around the node with a margin
    expect(findMermaidMindElementByPoint(board, [150, 250])?.id).toBe('flowchart');
    expect(findMermaidMindElementByPoint(board, [95, 195])?.id).toBe('flowchart');
    expect(findMermaidMindElementByPoint(board, [500, 500])).toBeNull();
    fixture.destroy();
  });

  it('switches the flowchart node to the editable state when double clicking it', () => {
    const fixture = setupMindForAITestingBoard(
      [withOptions as any, withMindExtend as any],
      [buildMind() as any]
    );
    const board = fixture.board;
    const flowchart = (board.children[0] as any).children[0];
    fakeLayoutNode(flowchart);
    const edit = fakeTextManage(flowchart);
    board.dblClick(new MouseEvent('dblclick', { clientX: 150, clientY: 250 }));
    expect(edit).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  it('does not switch to the editable state when double clicking outside of the flowchart', () => {
    const fixture = setupMindForAITestingBoard(
      [withOptions as any, withMindExtend as any],
      [buildMind() as any]
    );
    const board = fixture.board;
    const flowchart = (board.children[0] as any).children[0];
    fakeLayoutNode(flowchart);
    const edit = fakeTextManage(flowchart);
    board.dblClick(new MouseEvent('dblclick', { clientX: 500, clientY: 500 }));
    expect(edit).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
