import { getTextManages } from '@plait/common';
import { MindElement } from '@plait/mind';
import { PlaitBoard, RectangleClient, type PlaitElement, type Point } from '@plait/core';
import { getMermaidMindRenderRectangle, isMermaidMindElementForBoard } from './mermaid-mind';

/**
 * The rectangle of the rendered flowchart of the element, the element is not laid out before
 * it is mounted, so the rectangle is not available in that case.
 */
export const getMermaidMindElementRectangle = (element: PlaitElement): RectangleClient | null => {
  try {
    return getMermaidMindRenderRectangle(MindElement.getNode(element as MindElement));
  } catch {
    return null;
  }
};

/**
 * Find the mermaid mind element which is rendered at the given point, the rendered flowchart
 * is drawn above the topic of the node, the node itself can not be used to detect the double
 * click, so the rectangle of the rendered flowchart is used instead.
 */
export const findMermaidMindElementByPoint = (board: PlaitBoard, point: Point) => {
  const elements: PlaitElement[] = [];
  const collect = (items: PlaitElement[]) => {
    for (const item of items) {
      elements.push(item);
      const children = (item as any).children;
      if (Array.isArray(children)) {
        collect(children);
      }
    }
  };
  collect(board.children);
  const pointRectangle = RectangleClient.getRectangleByPoints([point, point]);
  for (const element of elements) {
    if (!isMermaidMindElementForBoard(element)) {
      continue;
    }
    const rectangle = getMermaidMindElementRectangle(element);
    if (rectangle && RectangleClient.isHit(pointRectangle, rectangle)) {
      return element;
    }
  }
  return null;
};

/**
 * Switch the mermaid mind element to the editable text state, the definition of the
 * flowchart is the topic of the node, so it can be modified directly.
 */
export const enterMermaidMindEditing = (board: PlaitBoard, element: PlaitElement) => {
  if (PlaitBoard.isReadonly(board) || PlaitBoard.hasBeenTextEditing(board)) {
    return;
  }
  const textManage = getTextManages(element)[0];
  if (!textManage || textManage.isEditing) {
    return;
  }
  textManage.edit(
    () => {},
    (event) => {
      const keyboardEvent = event as KeyboardEvent;
      return keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey;
    }
  );
};
