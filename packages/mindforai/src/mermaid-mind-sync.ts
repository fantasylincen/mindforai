import { getElementById, PlaitBoard, PlaitElement, Transforms } from '@plait/core';
import { buildText, getFirstTextManage } from '@plait/common';
import { MERMAID_MIND_RENDER_MARGIN } from './constants';
import {
  getMermaidDefinition,
  getMermaidMindData,
  getMindTopicText,
  MERMAID_MIND_KEY,
  removeMermaidTopicSize,
  setMermaidTopicSize,
} from './mermaid-mind';
import { getMermaidSvgSize } from './plugins/components/mermaid-mind';

/**
 * Keep the mermaid data of the element in sync with its topic text, the topic text is the
 * editable source of the flowchart definition, the mermaid data only caches the rendered size.
 */
export const syncMermaidMindElement = (board: PlaitBoard, element: PlaitElement, force = false) => {
  let current: PlaitElement | undefined;
  try {
    current = getElementById(board, element.id);
  } catch {
    return;
  }
  if (!current) {
    return;
  }
  const definition = getMermaidDefinition(current);
  const mermaidMind = getMermaidMindData(current);
  if (!definition && !mermaidMind) {
    return;
  }
  if (!force && PlaitElement.hasMounted(current)) {
    const textManage = getFirstTextManage(current);
    if (textManage?.isEditing) {
      return;
    }
  }
  const path = PlaitBoard.findPath(board, current);
  const topicText = getMindTopicText(current);
  const shouldSyncTopic = !topicText;
  if (!definition) {
    removeMermaidTopicSize(board, current);
    const data = { ...(current as any).data };
    delete data[MERMAID_MIND_KEY];
    Transforms.setNode(board, { data, manualWidth: null } as any, path);
    return;
  }
  const size = getMermaidSvgSize(definition);
  if (!size) {
    if ((mermaidMind && mermaidMind.mermaid !== definition) || shouldSyncTopic) {
      Transforms.setNode(
        board,
        {
          data: {
            ...(current as any).data,
            ...(shouldSyncTopic ? { topic: buildText(definition) } : {}),
            [MERMAID_MIND_KEY]: mermaidMind
              ? { ...mermaidMind, mermaid: definition }
              : { mermaid: definition, width: 0, height: 0 },
          },
        },
        path
      );
    }
    return;
  }
  const width = size.width + MERMAID_MIND_RENDER_MARGIN * 2;
  const topicSizeChanged = setMermaidTopicSize(board, current, {
    width: size.width,
    height: size.height,
  });
  const changed =
    !mermaidMind ||
    mermaidMind.mermaid !== definition ||
    Math.abs(mermaidMind.width - size.width) > 1 ||
    Math.abs(mermaidMind.height - size.height) > 1 ||
    (current as any).manualWidth !== width ||
    shouldSyncTopic ||
    topicSizeChanged;
  if (!changed) {
    return;
  }
  Transforms.setNode(
    board,
    {
      manualWidth: width,
      data: {
        ...(current as any).data,
        ...(shouldSyncTopic ? { topic: buildText(definition) } : {}),
        [MERMAID_MIND_KEY]: { mermaid: definition, width: size.width, height: size.height },
      },
    },
    path
  );
};

export const syncMermaidMindElements = (board: PlaitBoard) => {
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
  for (const element of elements) {
    syncMermaidMindElement(board, element);
  }
};
