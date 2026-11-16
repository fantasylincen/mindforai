// DATA-34 为 IDE 扩展与 Webview 提供不依赖浏览器文件 API 的文档打开与序列化入口
import { ListRender, PlaitBoard, PlaitElement, ThemeColorMode, Viewport } from '@plait/core';
import { DOCUMENT_FILE_EXTENSIONS, LEGACY_DOCUMENT_FILE_EXTENSIONS, MIME_TYPES } from '../constants';
import type { Language } from '../i18n/types';
import { applyDocumentDataToBoard, getMergeManifest } from './document-open';
import {
  applyDocumentManifestToElements,
  collectDocumentManifestBase64,
  readDocumentManifestBase64,
} from './document-manifest';
import { applyDefaultVisibleLevels } from './document-expansion';
import { validateDocumentContents, type DocumentValidationIssue } from './document-validation';
import { detectDocumentFormat } from './document-format';
import { getFileNameWithoutExtension } from './json';
import { serializeAsCompactDocument } from './compact-document';
import { serializeAsMindForAI } from './toon-document';
import { serializeAsMarkdown } from './markdown-document-save';
import type { DocumentExportedData, SaveableDocumentFormat } from './types';

export {
  setDocumentFileHost,
  getDocumentFileHost,
  activateHostDocumentFileChannel,
  isHostDocumentFileChannel,
} from './file-host';
export type {
  DocumentFileHost,
  HostFileHandle,
  HostOpenOptions,
  HostSaveOptions,
} from './file-host';
export { clearDocumentSession } from './document-session';
export type { MindForAIBoard } from '../hooks/use-mindforai';

export interface LoadedDocumentTextResult {
  ok: boolean;
  data: DocumentExportedData | null;
  format: SaveableDocumentFormat | null;
  issues: DocumentValidationIssue[];
}

export const resolveSaveableDocumentFormatByPath = (fileName: string): SaveableDocumentFormat => {
  const extension = /\.([^.\\/]+)$/.exec(fileName || '')?.[1].toLowerCase() || '';
  if (extension === 'md') {
    return 'markdown';
  }
  if (
    extension === DOCUMENT_FILE_EXTENSIONS.drawnixlite ||
    extension === LEGACY_DOCUMENT_FILE_EXTENSIONS.drawnixlite
  ) {
    return 'drawnixlite';
  }
  return 'mindforai';
};

export const loadDocumentText = (fileName: string, contents: string): LoadedDocumentTextResult => {
  const detection = detectDocumentFormat({ name: fileName, type: '' }, contents);
  const result = validateDocumentContents(contents, detection.format);
  return {
    ok: result.ok && !!result.data,
    data: result.data,
    format: result.format,
    issues: result.issues,
  };
};

export const serializeBoardDocumentText = (
  board: PlaitBoard,
  format: SaveableDocumentFormat,
  filePath: string
): string => {
  const manifestBase64 = collectDocumentManifestBase64(board, filePath);
  if (format === 'drawnixlite') {
    return serializeAsCompactDocument(board, manifestBase64);
  }
  if (format === 'markdown') {
    return serializeAsMarkdown(board, manifestBase64);
  }
  return serializeAsMindForAI(board, manifestBase64);
};

export const applyDocumentTextToBoard = (
  board: PlaitBoard,
  listRender: ListRender,
  fileName: string,
  contents: string
): LoadedDocumentTextResult => {
  const loaded = loadDocumentText(fileName, contents);
  if (!loaded.ok || !loaded.data) {
    return loaded;
  }
  applyDocumentDataToBoard(board, listRender, loaded.data, getMergeManifest(loaded.data, false));
  return loaded;
};

export interface InitialDocumentValue {
  elements: PlaitElement[];
  viewport?: Viewport;
  theme?: ThemeColorMode;
  language?: Language;
}

export const documentTextToInitialValue = (
  fileName: string,
  contents: string
): InitialDocumentValue | null => {
  const loaded = loadDocumentText(fileName, contents);
  if (!loaded.ok || !loaded.data) {
    return null;
  }
  const manifest = readDocumentManifestBase64(loaded.data.manifest);
  const elements = manifest
    ? applyDocumentManifestToElements(loaded.data.elements, manifest)
    : applyDefaultVisibleLevels(loaded.data.elements);
  return {
    elements,
    viewport: manifest?.viewport || loaded.data.viewport,
    theme: manifest?.theme as ThemeColorMode | undefined,
    language: manifest?.language as Language | undefined,
  };
};

export const getDocumentMimeTypeForFormat = (format: SaveableDocumentFormat): string => {
  if (format === 'drawnixlite') {
    return MIME_TYPES.drawnixlite;
  }
  if (format === 'markdown') {
    return MIME_TYPES.md;
  }
  return MIME_TYPES.mindforai;
};

export const buildDocumentFileName = (filePath: string, format: SaveableDocumentFormat): string => {
  const baseName = (filePath || 'untitled').split(/[\\/]/).pop() || 'untitled';
  const name = getFileNameWithoutExtension(baseName);
  const extension = format === 'markdown' ? 'md' : DOCUMENT_FILE_EXTENSIONS[format];
  return `${name}.${extension}`;
};
