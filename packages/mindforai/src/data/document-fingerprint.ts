// DATA-23 统计所有节点数量并按默认顺序拼接节点文本计算指纹 MD5
import { PlaitBoard, PlaitElement } from '@plait/core';
import { MindElement } from '@plait/mind';
import { computeMd5 } from '../utils/md5';
import { getAllDescendants } from '../components/toolbar/popup-toolbar/expand-collapse';

export interface DocumentFingerprint {
  nodeCount: number;
  md5: string;
}

export interface NodeFingerprint extends DocumentFingerprint {
  elementId: string;
}

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

const readMindElementText = (element: PlaitElement): string => {
  if (!MindElement.isMindElement(null, element)) {
    return '';
  }
  const topic = (element as MindElement).data?.topic;
  return readTextFromLeaves(topic);
};

const collectMindElementTexts = (element: PlaitElement, texts: string[], visited: Set<string>) => {
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
  texts.push(readMindElementText(mindElement));
  for (const descendant of getAllDescendants(mindElement)) {
    if (descendant.id && visited.has(descendant.id)) {
      continue;
    }
    if (descendant.id) {
      visited.add(descendant.id);
    }
    texts.push(readMindElementText(descendant));
  }
};

const getMindRoots = (board: PlaitBoard): PlaitElement[] => {
  return (board.children || []).filter((element) => MindElement.isMindElement(board, element));
};

export const computeBoardFingerprint = (board: PlaitBoard): DocumentFingerprint => {
  const texts: string[] = [];
  const visited = new Set<string>();
  for (const root of getMindRoots(board)) {
    collectMindElementTexts(root, texts, visited);
  }
  return { nodeCount: texts.length, md5: computeMd5(texts.join('')) };
};

export const computeNodeFingerprint = (
  element: PlaitElement | null | undefined
): NodeFingerprint | null => {
  if (!element || !MindElement.isMindElement(null, element)) {
    return null;
  }
  const mindElement = element as MindElement;
  const texts: string[] = [];
  const visited = new Set<string>();
  collectMindElementTexts(mindElement, texts, visited);
  return { elementId: mindElement.id, nodeCount: texts.length, md5: computeMd5(texts.join('')) };
};
