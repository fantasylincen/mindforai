// DATA-31 把画板内容保存为 Markdown 文档，并在文件末尾内嵌 manifest 字段
import { PlaitBoard } from '@plait/core';
import { MIME_TYPES } from '../constants';
import { fileSave } from './filesystem';
import { MindForAIFileHandle, getDefaultName } from './json';
import { convertToCompactDocument } from './compact-document';
import { appendManifestFieldToMarkdown, serializeMindForAITreeAsMarkdown } from './markdown-document';
import type { CompactDocumentNode, MindForAINode } from './types';

const compactNodeToMindForAINode = (node: CompactDocumentNode): MindForAINode | null => {
  const text = typeof node?.text === 'string' ? node.text : '';
  const children = (Array.isArray(node?.children) ? node.children : [])
    .map(compactNodeToMindForAINode)
    .filter((child): child is MindForAINode => child !== null);
  if (children.length) {
    return { text, children };
  }
  return text || null;
};

export const serializeAsMarkdown = (board: PlaitBoard, manifestBase64?: string): string => {
  const content = convertToCompactDocument({ elements: board.children })
    .content.map(compactNodeToMindForAINode)
    .filter((node): node is MindForAINode => node !== null);
  const markdownText = serializeMindForAITreeAsMarkdown(content);
  return appendManifestFieldToMarkdown(markdownText, manifestBase64);
};

export const saveAsMarkdown = async (
  board: PlaitBoard,
  name: string = getDefaultName(),
  existingFileHandle: MindForAIFileHandle = null,
  manifestBase64?: string
) => {
  const serialized = serializeAsMarkdown(board, manifestBase64);
  const blob = new Blob([serialized], {
    type: MIME_TYPES.md,
  });
  const fileHandle = await fileSave(blob, {
    name,
    extension: 'md',
    description: 'Markdown file',
    fileHandle: existingFileHandle,
  });
  return { fileHandle };
};
