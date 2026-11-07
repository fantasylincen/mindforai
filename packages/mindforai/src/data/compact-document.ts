// 实现 .drawnixlite 精简 JSON 树与 Plait 元素之间的互转与保存
import { PlaitBoard, PlaitElement, Viewport } from '@plait/core';
import { MindLayoutType } from '@plait/layouts';
import { MIME_TYPES, VERSIONS } from '../constants';
import { fileSave } from './filesystem';
import { parseFileContents } from './blob';
import { MindForAIFileHandle, getDefaultName } from './json';
import {
  DocumentExportedData,
  DocumentExportedType,
  CompactDocumentExportedData,
  CompactDocumentNode,
} from './types';

const ZERO_WIDTH = '\u200b\u200c\u200d\ufeff';

const cleanText = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  let text = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (const char of ZERO_WIDTH) {
    text = text.split(char).join('');
  }
  const lines = text.split('\n').map((line) => line.trim());
  return lines.filter((line) => line).join('\n');
};

const getMermaidMindText = (data: unknown): string => {
  if (!data || typeof data !== 'object') {
    return '';
  }
  const mermaidMind = (data as Record<string, any>).mermaidMind;
  if (!mermaidMind || typeof mermaidMind.mermaid !== 'string') {
    return '';
  }
  try {
    const payload = JSON.parse(mermaidMind.mermaid);
    if (payload && typeof payload.definition === 'string') {
      return cleanText(payload.definition);
    }
  } catch {}
  return cleanText(mermaidMind.mermaid);
};

const topicText = (topic: unknown): string => {
  if (typeof topic === 'string') {
    return cleanText(topic);
  }
  if (!topic || typeof topic !== 'object') {
    return '';
  }
  const parts: string[] = [];
  const ownText = cleanText((topic as Record<string, unknown>).text);
  if (ownText) {
    parts.push(ownText);
  }
  const children = (topic as Record<string, unknown>).children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const childText = topicText(child);
      if (childText) {
        parts.push(childText);
      }
    }
  }
  return cleanText(parts.join('\n'));
};

const extractElement = (element: unknown): CompactDocumentNode | null => {
  if (!element || typeof element !== 'object') {
    return null;
  }
  const record = element as Record<string, unknown>;
  const data = record.data;
  let text = '';
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const topic = 'topic' in data ? topicText((data as Record<string, unknown>).topic) : '';
    if (topic) {
      text = topic;
    } else {
      text = getMermaidMindText(data);
      if (!text) {
        text = topicText(data);
      }
    }
  } else if (typeof data === 'string') {
    text = cleanText(data);
  } else {
    text = topicText(element);
  }
  const children: CompactDocumentNode[] = [];
  if (Array.isArray(record.children)) {
    for (const child of record.children) {
      const node = extractElement(child);
      if (node) {
        children.push(node);
      }
    }
  }
  if (!text && !children.length) {
    return null;
  }
  const node: CompactDocumentNode = {};
  if (text) {
    node.text = text;
  }
  if (children.length) {
    node.children = children;
  }
  return node;
};

export const convertToCompactDocument = (document: unknown): CompactDocumentExportedData => {
  const record =
    document && typeof document === 'object'
      ? (document as Record<string, unknown>)
      : { elements: [document] };
  const elements = Array.isArray(record.elements) ? record.elements : [record];
  const content: CompactDocumentNode[] = [];
  for (const element of elements) {
    const node = extractElement(element);
    if (node) {
      content.push(node);
    }
  }
  return {
    type: DocumentExportedType.drawnixlite,
    version: VERSIONS.drawnixlite,
    content,
  };
};

export const serializeAsCompactDocument = (board: PlaitBoard, manifestBase64?: string): string => {
  const data = convertToCompactDocument({ elements: board.children });
  if (manifestBase64) {
    data.manifest = manifestBase64;
  }
  return JSON.stringify(data, null, 2);
};

export const saveAsCompactDocument = async (
  board: PlaitBoard,
  name: string = getDefaultName(),
  existingFileHandle: MindForAIFileHandle = null,
  manifestBase64?: string
) => {
  const serialized = serializeAsCompactDocument(board, manifestBase64);
  const blob = new Blob([serialized], {
    type: MIME_TYPES.drawnixlite,
  });
  const fileHandle = await fileSave(blob, {
    name,
    extension: 'drawnixlite',
    description: 'DrawnixLite file',
    fileHandle: existingFileHandle,
  });
  return { fileHandle };
};

let idSeed = 0;
const createNodeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(idSeed++).toString(36)}`;

export const isCompactDocumentData = (data?: any): data is CompactDocumentExportedData => {
  return !!data && data.type === DocumentExportedType.drawnixlite && Array.isArray(data.content);
};

const buildParagraph = (text: string) => ({
  children: [{ text }],
  type: 'paragraph',
});

interface MindNode {
  id: string;
  type: 'mind' | 'mind_child';
  data: { topic: ReturnType<typeof buildParagraph> };
  children: MindNode[];
  layout?: string;
}

const buildMindNode = (node: CompactDocumentNode, isRoot: boolean): MindNode | null => {
  if (!node || typeof node !== 'object') {
    return null;
  }
  const text = typeof node.text === 'string' ? node.text : '';
  const children = Array.isArray(node.children)
    ? node.children
        .map((child) => buildMindNode(child, false))
        .filter((child): child is MindNode => !!child)
    : [];
  if (!text && !children.length) {
    return null;
  }
  return {
    id: createNodeId('mind'),
    type: isRoot ? 'mind' : 'mind_child',
    data: { topic: buildParagraph(text) },
    children,
    ...(isRoot ? { layout: MindLayoutType.right } : {}),
  };
};

export const compactDocumentToDocumentData = (
  small: CompactDocumentExportedData
): DocumentExportedData => {
  const elements: PlaitElement[] = [];
  let offsetY = 0;
  for (const node of small.content) {
    const text = typeof node?.text === 'string' ? node.text : '';
    const children = Array.isArray(node?.children) ? node.children : [];
    const rootNode = text || children.length ? buildMindNode({ text, children }, true) : null;
    if (!rootNode) {
      continue;
    }
    elements.push({
      ...rootNode,
      points: [[0, offsetY]],
    } as PlaitElement);
    offsetY += 240;
  }
  const data: DocumentExportedData = {
    elements,
    viewport: { zoom: 1 } as Viewport,
  };
  if (small.manifest) {
    data.manifest = small.manifest;
  }
  return data;
};

export const loadCompactDocument = async (
  file: Blob | File
): Promise<DocumentExportedData | null> => {
  const contents = await parseFileContents(file);
  let data: unknown;
  try {
    data = JSON.parse(contents);
  } catch {
    return null;
  }
  if (isCompactDocumentData(data)) {
    return compactDocumentToDocumentData(data);
  }
  return null;
};
