// 负责节点复制与粘贴，以 mindforai 文本经系统剪贴板实现跨窗口共享
import { idCreator, PlaitBoard, PlaitElement, PlaitNode, Point, Transforms } from '@plait/core';
import { MindElement } from '@plait/mind';
import { buildClipboardData } from '@plait/draw';
import { convertToMindForAI, mindForAIToDocumentData } from './toon-document';
import { parseMindForAIText, serializeMindForAIText } from './mindforai-text';
import { convertToCompactDocument } from './compact-document';
import { serializeMindForAITreeAsMarkdown } from './markdown-document';

const regenerateElementIds = (elements: PlaitElement[]): PlaitElement[] => {
  return elements.map((element) => {
    const clonedElement = { ...element } as PlaitElement;
    clonedElement.id = idCreator();
    delete clonedElement.groupId;
    if (Array.isArray(element.children)) {
      clonedElement.children = regenerateElementIds(element.children);
    }
    return clonedElement;
  });
};

const buildMindChildCandidate = (element: PlaitElement): PlaitElement => {
  const childNode = regenerateElementIds([element])[0];
  childNode.type = 'mind_child';
  delete childNode.points;
  delete childNode.layout;
  delete childNode.start;
  delete childNode.end;
  delete childNode.rightNodeCount;
  return childNode;
};

export const writeClipboardText = async (text: string) => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }
  const temporaryTextarea = document.createElement('textarea');
  temporaryTextarea.value = text;
  temporaryTextarea.style.position = 'fixed';
  temporaryTextarea.style.opacity = '0';
  document.body.appendChild(temporaryTextarea);
  temporaryTextarea.select();
  const isCopied = document.execCommand('copy');
  temporaryTextarea.remove();
  if (!isCopied) {
    throw new Error('clipboard write failed');
  }
};

export const readClipboardText = async (): Promise<string> => {
  if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
    return '';
  }
  return navigator.clipboard.readText();
};

export const serializeNodesAsMindForAIText = (elements: PlaitElement[]): string => {
  return serializeMindForAIText(convertToMindForAI({ elements }));
};

export const copyNodeAsMindForAIText = async (elements: PlaitElement[]): Promise<void> => {
  await writeClipboardText(serializeNodesAsMindForAIText(elements));
};

export const serializeNodesAsDrawnixLiteText = (elements: PlaitElement[]): string => {
  return JSON.stringify(convertToCompactDocument({ elements }), null, 2);
};

export const serializeNodesAsMarkdownText = (elements: PlaitElement[]): string => {
  return serializeMindForAITreeAsMarkdown(convertToMindForAI({ elements }).content);
};

export const copyNodesAsDrawnixLiteText = async (elements: PlaitElement[]): Promise<void> => {
  await writeClipboardText(serializeNodesAsDrawnixLiteText(elements));
};

export const copyNodesAsMarkdownText = async (elements: PlaitElement[]): Promise<void> => {
  await writeClipboardText(serializeNodesAsMarkdownText(elements));
};

export const readClipboardNodeElements = async (): Promise<PlaitElement[] | null> => {
  let clipboardText = '';
  try {
    clipboardText = await readClipboardText();
  } catch {
    return null;
  }
  if (!clipboardText) {
    return null;
  }
  const textData = parseMindForAIText(clipboardText);
  if (!textData) {
    return null;
  }
  return mindForAIToDocumentData(textData).elements;
};

const buildChildNode = (board: PlaitBoard, element: PlaitElement): PlaitElement | null => {
  if (MindElement.isMindElement(board, element)) {
    return buildMindChildCandidate(element);
  }
  const points = element.points;
  const point: Point = Array.isArray(points) && points.length ? points[0] : [0, 0];
  try {
    const clipboardElements = buildClipboardData(board, [element as any], point);
    if (clipboardElements && clipboardElements.length === 1) {
      return buildMindChildCandidate(clipboardElements[0] as PlaitElement);
    }
  } catch {}
  return null;
};

export const pasteNodesAsChildren = (
  board: PlaitBoard,
  parentPath: number[],
  elements: PlaitElement[]
): boolean => {
  let parentNode: PlaitElement | null = null;
  try {
    parentNode = PlaitNode.get(board, parentPath);
  } catch {
    parentNode = null;
  }
  if (!parentNode || !MindElement.isMindElement(board, parentNode)) {
    return false;
  }
  const childNodes: PlaitElement[] = [];
  for (const element of elements) {
    const childNode = buildChildNode(board, element);
    if (childNode) {
      childNodes.push(childNode);
    }
  }
  if (!childNodes.length) {
    return false;
  }
  childNodes.forEach((childNode, index) => {
    Transforms.insertNode(board, childNode, [...parentPath, index]);
  });
  return true;
};
