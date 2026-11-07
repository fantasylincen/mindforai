// 提供 .mindforai 文本树的序列化、保存与加载能力，并兼容读取旧版 TOON 文档
import { PlaitBoard } from '@plait/core';
import { decode } from '@toon-format/toon';
import { DOCUMENT_FILE_EXTENSIONS, MIME_TYPES, VERSIONS } from '../constants';
import { parseFileContents } from './blob';
import { fileSave } from './filesystem';
import { MindForAIFileHandle, getDefaultName } from './json';
import { convertToCompactDocument, compactDocumentToDocumentData } from './compact-document';
import { parseMindForAIText, serializeMindForAIText } from './mindforai-text';
import {
  DocumentExportedData,
  DocumentExportedType,
  MindForAIExportedData,
  MindForAINode,
  CompactDocumentNode,
} from './types';

const readPlainRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const readNodeText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return '';
};

export const isMindForAIFile = (file: File) => {
  const fileName = (file.name || '').toLowerCase();
  return (
    fileName.endsWith(`.${DOCUMENT_FILE_EXTENSIONS.mindforai}`) ||
    (file.type || '') === MIME_TYPES.mindforai
  );
};

const compressCompactDocumentNode = (node: CompactDocumentNode): MindForAINode | null => {
  const text = typeof node?.text === 'string' ? node.text : '';
  const children = (Array.isArray(node?.children) ? node.children : [])
    .map(compressCompactDocumentNode)
    .filter((childNode): childNode is MindForAINode => childNode !== null);
  if (children.length) {
    return { text, children };
  }
  return text || null;
};

export const convertToMindForAI = (document: unknown): MindForAIExportedData => {
  const content = convertToCompactDocument(document)
    .content.map(compressCompactDocumentNode)
    .filter((node): node is MindForAINode => node !== null);
  return {
    type: DocumentExportedType.mindforai,
    version: VERSIONS.mindforai,
    content,
  };
};

export const serializeAsMindForAI = (board: PlaitBoard, manifestBase64?: string): string => {
  const data = convertToMindForAI({ elements: board.children });
  if (manifestBase64) {
    data.manifest = manifestBase64;
  }
  return serializeMindForAIText(data);
};

export const saveAsMindForAI = async (
  board: PlaitBoard,
  name: string = getDefaultName(),
  existingFileHandle: MindForAIFileHandle = null,
  manifestBase64?: string
) => {
  const serialized = serializeAsMindForAI(board, manifestBase64);
  const blob = new Blob([serialized], {
    type: MIME_TYPES.mindforai,
  });
  const fileHandle = await fileSave(blob, {
    name,
    extension: DOCUMENT_FILE_EXTENSIONS.mindforai,
    description: 'MindForAI file',
    fileHandle: existingFileHandle,
  });
  return { fileHandle };
};

export const isMindForAIData = (data: unknown): data is MindForAIExportedData => {
  const record = readPlainRecord(data);
  return (
    !!record && record.type === DocumentExportedType.mindforai && Array.isArray(record.content)
  );
};

const expandMindForAINode = (node: unknown): CompactDocumentNode | null => {
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    const plainText = readNodeText(node);
    return plainText ? { text: plainText } : null;
  }
  const record = readPlainRecord(node);
  if (!record) {
    return null;
  }
  const text = readNodeText(record.text);
  const children = (Array.isArray(record.children) ? record.children : [])
    .map(expandMindForAINode)
    .filter((childNode): childNode is CompactDocumentNode => childNode !== null);
  if (!text && !children.length) {
    return null;
  }
  return {
    ...(text ? { text } : {}),
    ...(children.length ? { children } : {}),
  };
};

export const mindForAIToDocumentData = (
  mindForAIData: MindForAIExportedData
): DocumentExportedData => {
  const content = mindForAIData.content
    .map(expandMindForAINode)
    .filter((node): node is CompactDocumentNode => node !== null);
  const data = compactDocumentToDocumentData({
    type: DocumentExportedType.drawnixlite,
    version: VERSIONS.drawnixlite,
    content,
  });
  if (mindForAIData.manifest) {
    data.manifest = mindForAIData.manifest;
  }
  return data;
};

export const loadMindForAI = async (file: Blob | File): Promise<DocumentExportedData | null> => {
  const contents = await parseFileContents(file);
  const textData = parseMindForAIText(contents);
  if (textData) {
    return mindForAIToDocumentData(textData);
  }
  let data: unknown;
  try {
    data = decode(contents);
  } catch {
    return null;
  }
  return isMindForAIData(data) ? mindForAIToDocumentData(data) : null;
};
