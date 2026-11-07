import {
  addSelectedElement,
  clearSelectedElement,
  getSelectedElements,
  PlaitBoard,
  PlaitNode,
  toHostPoint,
  toViewBoxPoint,
  type PlaitElement,
  type PlaitOptionsBoard,
} from '@plait/core';
import {
  MindElement,
  PlaitMind,
  WithMindPluginKey,
  type EmojiProps,
  type PlaitMindBoard,
  type PlaitMindEmojiBoard,
  type WithMindOptions,
} from '@plait/mind';
import { createRoot } from 'react-dom/client';
import { Emoji } from './components/emoji';
import { MermaidMind } from './components/mermaid-mind';
import type { RenderComponentRef } from '@plait/common';
import {
  getMermaidDefinition,
  getMermaidMindData,
  isMermaidMindElementForBoard,
} from '../mermaid-mind';
import { enterMermaidMindEditing, findMermaidMindElementByPoint } from '../mermaid-mind-editing';
import { syncMermaidMindElements } from '../mermaid-mind-sync';
import { getMermaidSvgSize } from './components/mermaid-mind';
import { MERMAID_MIND_RENDER_MARGIN } from '../constants';
import { MermaidMindNodeComponent, MermaidMindRootComponent } from './mermaid-mind-element';

export type PlaitMermaidMindBoard = PlaitBoard & {
  renderMermaidMind: (
    container: Element | DocumentFragment,
    props: MermaidMindProps
  ) => RenderComponentRef<MermaidMindProps>;
};

export interface MermaidMindProps {
  board: PlaitBoard;
  mermaid: string;
  width: number;
  height: number;
  onRendered: (svg: string) => void;
}

export { getMermaidSvgSize };

export const renderMermaidMindToBoard = (
  board: PlaitBoard,
  container: Element | DocumentFragment,
  props: MermaidMindProps
) => {
  const root = createRoot(container);
  root.render(<MermaidMind {...props} />);
  let newProps = { ...props };
  const ref: RenderComponentRef<MermaidMindProps> = {
    destroy: () => {
      setTimeout(() => {
        root.unmount();
      }, 0);
    },
    update: (updatedProps: Partial<MermaidMindProps>) => {
      newProps = { ...newProps, ...updatedProps };
      root.render(<MermaidMind {...newProps} />);
    },
  };
  return ref;
};

/**
 * The insertion of a child into a flowchart node is rejected, so the element which was
 * created by the insertion should not stay in the selection.
 */
const cleanInvalidSelection = (board: PlaitBoard) => {
  const selectedElements = getSelectedElements(board);
  if (!selectedElements.length) {
    return;
  }
  const validElements: PlaitElement[] = [];
  const collect = (items: PlaitElement[]) => {
    for (const item of items) {
      validElements.push(item);
      const children = (item as any).children;
      if (Array.isArray(children)) {
        collect(children);
      }
    }
  };
  collect(board.children);
  const validSelectedElements = selectedElements.filter((element) =>
    validElements.includes(element)
  );
  if (validSelectedElements.length === selectedElements.length) {
    return;
  }
  clearSelectedElement(board);
  validSelectedElements.forEach((element) => addSelectedElement(board, element));
};

/**
 * The rectangle of the rendered flowchart of the element, the element is not laid out before
 * it is mounted, so the rectangle is not available in that case.
 */
export const withMindExtend = (board: PlaitBoard) => {
  const newBoard = board as PlaitBoard &
    PlaitMindBoard &
    PlaitMindEmojiBoard &
    PlaitMermaidMindBoard;

  (board as PlaitOptionsBoard).setPluginOptions<WithMindOptions>(WithMindPluginKey, {
    emojiPadding: 0,
    spaceBetweenEmojis: 4,
  });

  newBoard.renderEmoji = (container: Element | DocumentFragment, props: EmojiProps) => {
    const emojiContainer = document.createElement('span');
    container.appendChild(emojiContainer);
    const root = createRoot(emojiContainer);
    root.render(<Emoji {...props}></Emoji>);
    let newProps = { ...props };
    const ref: RenderComponentRef<EmojiProps> = {
      destroy: () => {
        setTimeout(() => {
          root.unmount();
        }, 0);
      },
      update: (updatedProps: Partial<EmojiProps>) => {
        newProps = { ...newProps, ...updatedProps };
        root.render(<Emoji {...newProps}></Emoji>);
      },
    };
    return ref;
  };

  newBoard.renderMermaidMind = (container: Element | DocumentFragment, props: MermaidMindProps) => {
    return renderMermaidMindToBoard(newBoard, container, props);
  };

  const { apply } = newBoard;
  newBoard.apply = (operation) => {
    if (operation.type === 'insert_node') {
      let parent: PlaitElement | undefined;
      try {
        parent = PlaitNode.get(newBoard, operation.path.slice(0, -1));
      } catch {}
      if (isMermaidMindElementForBoard(parent)) {
        return;
      }
    }
    apply(operation);
  };

  const { drawElement } = newBoard;
  newBoard.drawElement = (context) => {
    if (MindElement.isMindElement(newBoard, context.element)) {
      return PlaitMind.isMind(context.element)
        ? MermaidMindRootComponent
        : MermaidMindNodeComponent;
    }
    return drawElement(context);
  };

  const { dblClick } = newBoard;
  newBoard.dblClick = (event) => {
    // double clicking a flowchart node switches it to the editable text state, the
    // rendered flowchart is drawn above the topic of the node, so the double click is
    // detected by the rectangle of the rendered flowchart
    const point = toViewBoxPoint(newBoard, toHostPoint(newBoard, event.clientX, event.clientY));
    const mermaidElement = findMermaidMindElementByPoint(newBoard, point);
    if (mermaidElement) {
      enterMermaidMindEditing(newBoard, mermaidElement);
      return;
    }
    dblClick(event);
  };

  const { afterChange } = newBoard;
  newBoard.afterChange = () => {
    afterChange();
    cleanInvalidSelection(newBoard);
    syncMermaidMindElements(newBoard);
  };

  const { getRectangle } = newBoard;
  newBoard.getRectangle = (element) => {
    try {
      return getRectangle(element);
    } catch (error) {
      const definition = getMermaidDefinition(element);
      const size = definition ? getMermaidSvgSize(definition) : null;
      const mermaidMind = getMermaidMindData(element);
      const width = size?.width ?? mermaidMind?.width;
      const height = size?.height ?? mermaidMind?.height;
      if (width !== undefined && height !== undefined && element.points) {
        return {
          x: element.points[0][0],
          y: element.points[0][1],
          width: width + MERMAID_MIND_RENDER_MARGIN * 2,
          height: height + MERMAID_MIND_RENDER_MARGIN * 2,
        };
      }
      throw error;
    }
  };

  return newBoard;
};
