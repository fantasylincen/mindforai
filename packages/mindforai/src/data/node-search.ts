// DATA-29 在所有思维导图节点中检索文本，展开祖先、居中定位并高亮当前匹配
import {
  addSelectedElement,
  BoardTransforms,
  clearSelectedElement,
  getRectangleByElements,
  PlaitBoard,
  PlaitElement,
  Transforms,
} from '@plait/core';
import { MindElement } from '@plait/mind';

export interface NodeSearchMatch {
  elementId: string;
  element: MindElement;
  occurrence: number;
}

const SEARCH_HIGHLIGHT_NAME = 'mindforai-search-current';

let revealToken = 0;

const readTextFromLeaves = (value: unknown): string => {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const record = value as Record<string, unknown>;
  if (typeof record.text === 'string') {
    return record.text;
  }
  if (Array.isArray(record.children)) {
    return record.children.map((child) => readTextFromLeaves(child)).join('');
  }
  return '';
};

export const getMindElementText = (element: MindElement): string => {
  return readTextFromLeaves(element.data?.topic);
};

const collectMindElements = (board: PlaitBoard): Array<{ element: MindElement; text: string }> => {
  const result: Array<{ element: MindElement; text: string }> = [];
  const visited = new Set<string>();

  const visit = (element: PlaitElement) => {
    if (!MindElement.isMindElement(null, element)) {
      return;
    }
    const mindElement = element as MindElement;
    if (mindElement.id) {
      if (visited.has(mindElement.id)) {
        return;
      }
      visited.add(mindElement.id);
    }
    result.push({ element: mindElement, text: getMindElementText(mindElement) });
    for (const child of mindElement.children || []) {
      visit(child as PlaitElement);
    }
  };

  for (const root of board.children || []) {
    visit(root);
  }
  return result;
};

export const findNodeMatches = (board: PlaitBoard, query: string): NodeSearchMatch[] => {
  const needle = query.trim();
  if (!needle) {
    return [];
  }
  const lowerNeedle = needle.toLowerCase();
  const matches: NodeSearchMatch[] = [];
  for (const { element, text } of collectMindElements(board)) {
    if (!element.id || !text) {
      continue;
    }
    const lowerText = text.toLowerCase();
    let occurrence = 0;
    let fromIndex = 0;
    while (fromIndex <= lowerText.length) {
      const matchIndex = lowerText.indexOf(lowerNeedle, fromIndex);
      if (matchIndex === -1) {
        break;
      }
      matches.push({ elementId: element.id, element, occurrence });
      occurrence += 1;
      fromIndex = matchIndex + Math.max(1, lowerNeedle.length);
    }
  }
  return matches;
};

const collectAncestors = (board: PlaitBoard, path: number[]): PlaitElement[] => {
  const ancestors: PlaitElement[] = [];
  let children = (board.children || []) as PlaitElement[];
  for (let depth = 0; depth < path.length - 1; depth += 1) {
    const node = children[path[depth]];
    if (!node) {
      break;
    }
    ancestors.push(node);
    children = (node.children || []) as PlaitElement[];
  }
  return ancestors;
};

const findElementPath = (
  elements: PlaitElement[] | undefined,
  target: MindElement,
  prefix: number[] = []
): number[] | null => {
  const children = elements || [];
  for (let index = 0; index < children.length; index += 1) {
    const element = children[index];
    if (element === target || (target.id && element.id === target.id)) {
      return [...prefix, index];
    }
    const childElements = (element as { children?: PlaitElement[] }).children;
    if (Array.isArray(childElements) && childElements.length) {
      const found = findElementPath(childElements, target, [...prefix, index]);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const findElementById = (elements: PlaitElement[] | undefined, id: string): MindElement | null => {
  for (const element of elements || []) {
    if (!MindElement.isMindElement(null, element)) {
      continue;
    }
    const mindElement = element as MindElement;
    if (mindElement.id === id) {
      return mindElement;
    }
    const found = findElementById(mindElement.children as PlaitElement[], id);
    if (found) {
      return found;
    }
  }
  return null;
};

const expandAncestors = (board: PlaitBoard, element: MindElement): MindElement => {
  const path = findElementPath(board.children as PlaitElement[], element);
  if (!path) {
    return element;
  }
  const ancestors = collectAncestors(board, path);
  ancestors.forEach((ancestor, index) => {
    if (!(ancestor as { isCollapsed?: boolean }).isCollapsed) {
      return;
    }
    try {
      Transforms.setNode(board, { isCollapsed: false }, path.slice(0, index + 1));
    } catch {}
  });
  const liveElement = findElementById(board.children as PlaitElement[], element.id) || element;
  if ((liveElement as unknown as { isCollapsed?: boolean }).isCollapsed) {
    try {
      Transforms.setNode(board, { isCollapsed: false }, path);
    } catch {}
  }
  return liveElement;
};

const readElementRectangle = (board: PlaitBoard, element: MindElement) => {
  try {
    const rectangle = getRectangleByElements(board, [element], false);
    if (
      !rectangle ||
      !Number.isFinite(rectangle.x) ||
      !Number.isFinite(rectangle.y) ||
      !Number.isFinite(rectangle.width) ||
      !Number.isFinite(rectangle.height) ||
      rectangle.width <= 0 ||
      rectangle.height <= 0
    ) {
      return null;
    }
    return rectangle;
  } catch {
    return null;
  }
};

const selectSingleElement = (board: PlaitBoard, element: MindElement) => {
  clearSelectedElement(board);
  addSelectedElement(board, element);
};

const centerElement = (board: PlaitBoard, element: MindElement) => {
  const rectangle = readElementRectangle(board, element);
  if (!rectangle) {
    return;
  }
  const boardContainerRect = PlaitBoard.getBoardContainer(board).getBoundingClientRect();
  const zoom = board.viewport.zoom || 1;
  const centerX = rectangle.x + rectangle.width / 2;
  const centerY = rectangle.y + rectangle.height / 2;
  const origination: [number, number] = [
    centerX - boardContainerRect.width / 2 / zoom,
    centerY - boardContainerRect.height / 2 / zoom,
  ];
  BoardTransforms.updateViewport(board, origination, zoom);
};

const collectTextNodes = (root: Element): Text[] => {
  if (typeof document === 'undefined' || typeof NodeFilter === 'undefined') {
    return [];
  }
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('.collapse-button, .expanded-button')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let current = walker.nextNode();
  while (current) {
    if (current.nodeValue) {
      nodes.push(current as Text);
    }
    current = walker.nextNode();
  }
  return nodes;
};

const createRangeForSpan = (
  segments: Array<{ node: Text; start: number; end: number }>,
  startOffset: number,
  endOffset: number
): Range | null => {
  if (!segments.length || typeof document === 'undefined') {
    return null;
  }
  const findSegment = (offset: number) => {
    for (const segment of segments) {
      if (offset <= segment.end) {
        return segment;
      }
    }
    return segments[segments.length - 1];
  };
  const startSegment = findSegment(startOffset);
  const endSegment = findSegment(endOffset);
  const range = document.createRange();
  range.setStart(startSegment.node, Math.max(0, startOffset - startSegment.start));
  range.setEnd(endSegment.node, Math.max(0, endOffset - endSegment.start));
  return range;
};

const applyHighlightApi = (range: Range) => {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') {
    return;
  }
  const highlightConstructor = (
    window as unknown as { Highlight?: new (range: Range) => unknown }
  ).Highlight;
  const highlights = (
    CSS as unknown as {
      highlights?: {
        set: (name: string, highlight: unknown) => void;
        delete: (name: string) => void;
      };
    }
  ).highlights;
  if (!highlightConstructor || !highlights) {
    return;
  }
  highlights.set(SEARCH_HIGHLIGHT_NAME, new highlightConstructor(range));
};

export const clearNodeMatchHighlight = () => {
  revealToken += 1;
  if (typeof document === 'undefined') {
    return;
  }
  if (typeof CSS === 'undefined') {
    return;
  }
  const highlights = (CSS as unknown as { highlights?: { delete: (name: string) => void } })
    .highlights;
  highlights?.delete(SEARCH_HIGHLIGHT_NAME);
};

export const clearNodeSelection = (board: PlaitBoard) => {
  clearSelectedElement(board);
  const viewport = board.viewport;
  if (viewport && viewport.origination) {
    BoardTransforms.updateViewport(board, viewport.origination, viewport.zoom);
  }
};

const findHostElement = (elementId: string): Element | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const escapedId =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(elementId) : elementId;
  return document.querySelector(`[plait-data-id="${escapedId}"]`);
};

const highlightNodeMatch = (elementId: string, query: string, occurrence: number) => {
  if (typeof document === 'undefined') {
    return;
  }
  const needle = query.trim();
  if (!needle) {
    return;
  }
  const host = findHostElement(elementId);
  if (!host) {
    return;
  }
  const textNodes = collectTextNodes(host);
  if (!textNodes.length) {
    return;
  }
  const segments: Array<{ node: Text; start: number; end: number }> = [];
  let cursor = 0;
  let fullText = '';
  for (const node of textNodes) {
    const value = node.nodeValue || '';
    segments.push({ node, start: cursor, end: cursor + value.length });
    fullText += value;
    cursor += value.length;
  }
  const lowerText = fullText.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let matchIndex = -1;
  let fromIndex = 0;
  for (let index = 0; index <= occurrence; index += 1) {
    matchIndex = lowerText.indexOf(lowerNeedle, fromIndex);
    if (matchIndex === -1) {
      return;
    }
    fromIndex = matchIndex + Math.max(1, lowerNeedle.length);
  }
  const range = createRangeForSpan(segments, matchIndex, matchIndex + lowerNeedle.length);
  if (range) {
    applyHighlightApi(range);
  }
};

const scheduleFrame = (callback: () => void) => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
    return;
  }
  setTimeout(callback, 16);
};

const nowMs = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

const revealWhenReady = (
  board: PlaitBoard,
  elementId: string,
  fallbackElement: MindElement,
  query: string,
  occurrence: number,
  token: number
) => {
  const deadline = nowMs() + 900;
  let hostSeenFrames = 0;
  let stableFrames = 0;
  let previousRectangleKey = '';
  const resolveLiveElement = () =>
    findElementById(board.children as PlaitElement[], elementId) || fallbackElement;
  const finish = () => {
    if (token !== revealToken) {
      return;
    }
    const liveElement = resolveLiveElement();
    selectSingleElement(board, liveElement);
    centerElement(board, liveElement);
    highlightNodeMatch(elementId, query, occurrence);
  };
  const tick = () => {
    if (token !== revealToken) {
      return;
    }
    const host = findHostElement(elementId);
    if (host) {
      hostSeenFrames += 1;
    }
    const rectangle = readElementRectangle(board, resolveLiveElement());
    const rectangleKey = rectangle
      ? `${Math.round(rectangle.x)},${Math.round(rectangle.y)},${Math.round(rectangle.width)},${Math.round(rectangle.height)}`
      : '';
    if (rectangleKey && rectangleKey === previousRectangleKey) {
      stableFrames += 1;
    } else {
      stableFrames = 0;
      previousRectangleKey = rectangleKey;
    }
    const layoutReady = !!host && hostSeenFrames >= 2 && stableFrames >= 2;
    if (layoutReady || nowMs() >= deadline) {
      finish();
      return;
    }
    scheduleFrame(tick);
  };
  scheduleFrame(tick);
};

export const revealNodeMatch = (
  board: PlaitBoard,
  match: NodeSearchMatch,
  query: string
) => {
  const token = revealToken + 1;
  revealToken = token;
  clearNodeMatchHighlight();
  revealToken = token;
  expandAncestors(board, match.element);
  if (typeof document === 'undefined') {
    return;
  }
  revealWhenReady(board, match.elementId, match.element, query, match.occurrence, token);
};