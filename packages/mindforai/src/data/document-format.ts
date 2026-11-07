// 统一判断文档格式：优先依据文件名扩展名，其次依据文件开头的类型声明
import { DOCUMENT_FILE_EXTENSIONS, MIME_TYPES } from '../constants';
import { isMarkdownFileName } from './markdown-to-mindforai';
import { DocumentFormat, SaveableDocumentFormat } from './types';

export type DocumentFormatDetection = {
  format: DocumentFormat | null;
  source: 'name' | 'header' | 'mime' | 'fallback';
};

const FORMAT_EXTENSIONS = DOCUMENT_FILE_EXTENSIONS;
const FORMAT_MIME_TYPES: Record<string, DocumentFormat> = {
  [MIME_TYPES.drawnixlite]: 'drawnixlite',
  [MIME_TYPES.mindforai]: 'mindforai',
};

export const getDocumentExtension = (fileName: string): string => {
  const match = /\.([^.\\/]+)$/.exec(fileName || '');
  return match ? match[1].toLowerCase() : '';
};

export const resolveDocumentFormatByName = (fileName: string): DocumentFormat | null => {
  if (isMarkdownFileName(fileName)) {
    return 'markdown';
  }
  const extension = getDocumentExtension(fileName);
  if (!extension) {
    return null;
  }
  const matched = (Object.keys(FORMAT_EXTENSIONS) as Exclude<SaveableDocumentFormat, 'markdown'>[]).find(
    (format) => FORMAT_EXTENSIONS[format] === extension
  );
  return matched || null;
};

const readJsonDocumentType = (contents: string): string | null => {
  const trimmed = contents.replace(/^\uFEFF/, '').trimStart();
  if (!/^[{[]/.test(trimmed)) {
    return null;
  }
  const typeMatch = /"type"\s*:\s*"([^"]*)"/.exec(trimmed.slice(0, 4096));
  return typeMatch ? typeMatch[1] : null;
};

const readTextDocumentType = (contents: string): string | null => {
  const head = contents.replace(/^\uFEFF/, '');
  const typeMatch = /^\s*type\s*:\s*([^\s]+)/.exec(head);
  return typeMatch ? typeMatch[1] : null;
};

export const resolveDocumentFormatByHeader = (contents: string): DocumentFormat | null => {
  const jsonType = readJsonDocumentType(contents);
  if (jsonType === 'drawnixlite') {
    return 'drawnixlite';
  }
  if (jsonType === 'mindforai') {
    return 'mindforai';
  }
  if (jsonType === null) {
    const textType = readTextDocumentType(contents);
    if (textType === 'mindforai') {
      return 'mindforai';
    }
  }
  return null;
};

export const resolveDocumentFormatByMime = (
  file?: Pick<File, 'type'> | null
): DocumentFormat | null => {
  const mimeType = file?.type || '';
  return FORMAT_MIME_TYPES[mimeType] || null;
};

export const detectDocumentFormat = (
  file: Pick<File, 'name' | 'type'>,
  contents?: string
): DocumentFormatDetection => {
  const byName = resolveDocumentFormatByName(file.name);
  if (byName) {
    return { format: byName, source: 'name' };
  }
  const byMime = resolveDocumentFormatByMime(file);
  if (byMime) {
    return { format: byMime, source: 'mime' };
  }
  const byHeader = contents ? resolveDocumentFormatByHeader(contents) : null;
  if (byHeader) {
    return { format: byHeader, source: 'header' };
  }
  const head = (contents || '').replace(/^\uFEFF/, '').trimStart();
  if (/^[{[]/.test(head)) {
    return { format: null, source: 'header' };
  }
  return { format: 'mindforai', source: 'fallback' };
};
