import { clearElementSizeCache, updateElementSizeCache } from '@plait/common';
import { PlaitBoard, PlaitElement, RectangleClient } from '@plait/core';
import { MindElement, MindNode } from '@plait/mind';
import { MERMAID_MIND_RENDER_MARGIN } from './constants';

export const MERMAID_MIND_KEY = 'mermaidMind';

export interface MermaidMindData {
  /**
   * JSON string of the whole flowchart: `{ definition, elements }`.
   */
  mermaid: string;
  width: number;
  height: number;
}

export interface MermaidMindPayload {
  definition: string;
  elements: PlaitElement[];
}

type MindDataWithMermaid = Record<string, any> & {
  [MERMAID_MIND_KEY]?: MermaidMindData;
};

export const buildMermaidMindPayload = (definition: string, elements: PlaitElement[]): string => {
  return JSON.stringify({ definition, elements } as MermaidMindPayload);
};

export const parseMermaidMindPayload = (mermaid: string): MermaidMindPayload => {
  try {
    const payload = JSON.parse(mermaid);
    if (payload && typeof payload.definition === 'string') {
      return {
        definition: payload.definition,
        elements: Array.isArray(payload.elements) ? payload.elements : [],
      };
    }
  } catch {}
  return { definition: mermaid, elements: [] };
};

export const getMermaidMindData = (element?: PlaitElement | null): MermaidMindData | null => {
  const data = (element as MindDataWithMermaid | undefined)?.data;
  const mermaidMind = data?.[MERMAID_MIND_KEY];
  if (
    mermaidMind &&
    typeof mermaidMind.mermaid === 'string' &&
    typeof mermaidMind.width === 'number' &&
    typeof mermaidMind.height === 'number'
  ) {
    return mermaidMind;
  }
  return null;
};

const getSlateText = (node: any): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (!node || typeof node !== 'object') {
    return '';
  }
  const parts: string[] = [];
  if (typeof node.text === 'string') {
    parts.push(node.text);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      parts.push(getSlateText(child));
    }
  }
  return parts.join('');
};

export const getMindTopicText = (element?: PlaitElement | null): string => {
  const topic = (element as { data?: { topic?: unknown } } | undefined)?.data?.topic;
  return getSlateText(topic).trim();
};

export const isMermaidFlowchartDefinition = (text?: string | null): boolean =>
  /^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL)\b/i.test(text || '');

const mermaidTopicSizes = new WeakMap<object, { width: number; height: number }>();

/**
 * The flowchart definition is kept in the node topic so that it stays editable, but the
 * topic is hidden while the flowchart is rendered. Overriding the measured size of the
 * topic keeps the node frame aligned with the rendered flowchart instead of the hidden text.
 */
export const setMermaidTopicSize = (
  board: PlaitBoard | null,
  element: PlaitElement | null | undefined,
  size: { width: number; height: number }
): boolean => {
  const topic = (element as { data?: { topic?: unknown } } | undefined)?.data?.topic;
  if (!topic || typeof topic !== 'object') {
    return false;
  }
  const current = mermaidTopicSizes.get(topic);
  if (current && current.width === size.width && current.height === size.height) {
    return false;
  }
  mermaidTopicSizes.set(topic, size);
  updateElementSizeCache(board, topic as any, size);
  return true;
};

export const removeMermaidTopicSize = (board: PlaitBoard | null, element?: PlaitElement | null) => {
  const topic = (element as { data?: { topic?: unknown } } | undefined)?.data?.topic;
  if (!topic || typeof topic !== 'object') {
    return;
  }
  clearElementSizeCache(board, topic as any);
  mermaidTopicSizes.delete(topic);
};

export const getMermaidDefinition = (element?: PlaitElement | null): string | null => {
  if (!element) {
    return null;
  }
  const topicText = getMindTopicText(element);
  if (isMermaidFlowchartDefinition(topicText)) {
    return topicText;
  }
  if (!topicText) {
    const mermaidMind = getMermaidMindData(element);
    if (mermaidMind) {
      const definition = parseMermaidMindPayload(mermaidMind.mermaid).definition.trim();
      if (definition) {
        return definition;
      }
    }
  }
  return null;
};

export const isMermaidLeafElement = (element?: PlaitElement | null) =>
  !!element && (!!getMermaidMindData(element) || !!getMermaidDefinition(element));

export const isMermaidMindElementForBoard = (element?: PlaitElement | null): boolean =>
  !!element &&
  MindElement.isMindElement(null, element) &&
  (!!getMermaidMindData(element) || !!getMermaidDefinition(element));

/**
 * The rectangle of the rendered flowchart, the flowchart is drawn around the topic of the
 * node with a small margin, so double clicking the rendered flowchart is always inside the
 * node and can be used to switch the node to the editable text state.
 */
export const getMermaidMindRenderRectangle = (node: MindNode): RectangleClient => ({
  x: node.x + node.hGap - MERMAID_MIND_RENDER_MARGIN,
  y: node.y + node.vGap - MERMAID_MIND_RENDER_MARGIN,
  width: node.width - node.hGap * 2 + MERMAID_MIND_RENDER_MARGIN * 2,
  height: node.height - node.vGap * 2 + MERMAID_MIND_RENDER_MARGIN * 2,
});
