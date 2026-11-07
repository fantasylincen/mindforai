import {
  addSelectedElement,
  clearSelectedElement,
  PlaitBoard,
  PlaitElement,
  PlaitNode,
  Transforms,
} from '@plait/core';
import { createMindElement, MindElement } from '@plait/mind';
import { MindLayoutType } from '@plait/layouts';
import { MERMAID_MIND_RENDER_MARGIN } from './constants';
import { MERMAID_MIND_KEY, setMermaidTopicSize } from './mermaid-mind';

export const DEFAULT_MERMAID_FLOWCHART = [
  'flowchart TD',
  '  A[开始] --> B{判断}',
  '  B -->|是| C[结束]',
  '  B -->|否| D[继续]',
].join('\n');

const DEFAULT_MERMAID_WIDTH = 220;
const DEFAULT_MERMAID_HEIGHT = 110;

const getInheritAttributes = (parent?: PlaitElement) => {
  const source = parent as any;
  if (!source) {
    return {};
  }
  const attrs: Record<string, any> = {};
  ['fill', 'strokeColor', 'strokeWidth', 'strokeStyle', 'branchColor', 'branchWidth'].forEach(
    (key) => {
      if (source[key] !== undefined) {
        attrs[key] = source[key];
      }
    }
  );
  return attrs;
};

export const createMermaidMindElement = (
  definition: string,
  parent?: PlaitElement
): MindElement => {
  const width = DEFAULT_MERMAID_WIDTH + MERMAID_MIND_RENDER_MARGIN * 2;
  const mindElement = createMindElement(definition, {
    layout: MindLayoutType.right,
    ...getInheritAttributes(parent),
  }) as MindElement;
  const element = {
    ...mindElement,
    layout: undefined,
    manualWidth: width,
    data: {
      ...mindElement.data,
      [MERMAID_MIND_KEY]: {
        mermaid: definition,
        width: DEFAULT_MERMAID_WIDTH,
        height: DEFAULT_MERMAID_HEIGHT,
      },
    },
  } as MindElement;
  setMermaidTopicSize(null, element, {
    width: DEFAULT_MERMAID_WIDTH,
    height: DEFAULT_MERMAID_HEIGHT,
  });
  return element;
};

export const insertMermaidMindNode = (
  board: PlaitBoard,
  parent: MindElement,
  definition: string
): MindElement => {
  const element = createMermaidMindElement(definition, parent);
  const parentPath = PlaitBoard.findPath(board, parent);
  const parentIndex = parent.children?.length || 0;
  const path = [...parentPath, parentIndex];
  Transforms.insertNode(board, element, path);
  const inserted = PlaitNode.get(board, path) as MindElement;
  clearSelectedElement(board);
  addSelectedElement(board, inserted);
  return inserted;
};
